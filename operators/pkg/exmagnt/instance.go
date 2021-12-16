// Copyright 2020-2021 Politecnico di Torino
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Package exmagnt contains the main logic and helpers
// for the crownlabs exam agent component.
package exmagnt

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"net/http"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/klog/v2"
	ctrl "sigs.k8s.io/controller-runtime"
	ctrlutil "sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	clv1alpha2 "github.com/netgroup-polito/CrownLabs/operators/api/v1alpha2"
	"github.com/netgroup-polito/CrownLabs/operators/pkg/forge"
)

//go:embed redirecting.html
var httpPageStartingUp string

// EAInstance represents an Instance within the exmagnt.
type EAInstance struct {
	ID       string `json:"id"`
	Template string `json:"template"`
	Running  bool   `json:"running"`
	// TODO: CustomizationUrls clv1alpha2.InstanceCustomizationUrls `json:"customizationUrls"`
}

// EAInstanceHandler is the handler for the EAINstance.
type EAInstanceHandler struct{}

// ServeHTTP is the Instance handler for the exmagnt.
func (i EAInstanceHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	klog.V(3).Infof("Request received: %+v", r.URL.Query())

	switch r.Method {
	case http.MethodGet:
		i.HandleGet(w, r)
	case http.MethodPut:
		i.HandlePut(w, r)
	case http.MethodDelete:
		i.HandleDelete(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		fmt.Fprintf(w, "Method not allowed")
		return
	}
}

// HandleGet handles the GET request for the exmagnt.
func (i *EAInstanceHandler) HandleGet(w http.ResponseWriter, r *http.Request) {
	inst := EmptyInstanceFromRequest(r)

	if err := Client.Get(r.Context(), forge.NamespacedName(inst), inst); err != nil {
		if errors.IsNotFound(err) {
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprint(w, "Not found")
			return
		}
		klog.Errorf("Error retrieving instance %s: %v", inst.Name, err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "Error retrieving instance")
		return
	}

	if inst.Status.Phase == clv1alpha2.EnvironmentPhaseReady {
		klog.Infof("Redirecting %v to %s", inst.Name, inst.Status.URL)
		http.Redirect(w, r, inst.Status.URL, http.StatusFound)
		return
	}

	if inst.Status.Phase == clv1alpha2.EnvironmentPhaseFailed || inst.Status.Phase == clv1alpha2.EnvironmentPhaseCreationLoopBackoff {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "Something went wrong. Please retry later")
		klog.Errorf("Instance %s INVALID PHSE: %v", inst.Name, inst.Status.Phase)
		return
	}

	klog.V(2).Infof("Instance %s (phase: %v): sending starting-up page", inst.Name, inst.Status.Phase)

	w.Header().Add("refresh", "5")
	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, httpPageStartingUp)
}

// HandlePut handles the PUT request for a EAInstance api call.
func (i *EAInstanceHandler) HandlePut(w http.ResponseWriter, r *http.Request) {
	if !Options.CheckAllowedIP(r) {
		klog.Errorf("Request from unauthorized IP: %v", r.RemoteAddr)
		w.WriteHeader(http.StatusForbidden)
		fmt.Fprint(w, "Forbidden")
		return
	}

	// get Instance from the request
	cleaInstance, err := EAInstanceFromRequest(r)
	if err != nil {
		klog.Errorf("Error parsing request: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, "Bad request")
		return
	}

	inst := EmptyInstanceFromRequest(r)
	if inst.Name != cleaInstance.ID {
		klog.Errorf("Incoherent EAInstance ids %s:%s", inst.Name, cleaInstance.ID)
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, "Bad request")
		return
	}

	instSpec := InstanceSpecFromEAInstance(&cleaInstance)

	op, err := ctrl.CreateOrUpdate(r.Context(), Client, inst, func() error {
		inst.Spec = instSpec
		return nil
	})

	if err != nil {
		klog.Errorf("Instance %s cannot be %s: %v", inst.Name, op, err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Instance %s cannot be %s", inst.Name, op)
		return
	}

	switch op {
	case ctrlutil.OperationResultCreated:
		w.WriteHeader(http.StatusCreated)
	case ctrlutil.OperationResultUpdated:
		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, op)
}

// GetInstanceIDFromRequest returns the instance id from the request.
func GetInstanceIDFromRequest(r *http.Request) string {
	klog.Infoln("request for instance:", r.URL.Path)
	return r.URL.Path
}

// HandleDelete handles the DELETE request for a EAInstance api call.
func (i *EAInstanceHandler) HandleDelete(w http.ResponseWriter, r *http.Request) {
	if !Options.CheckAllowedIP(r) {
		klog.Errorf("Request from unauthorized IP: %v", r.RemoteAddr)
		w.WriteHeader(http.StatusForbidden)
		fmt.Fprint(w, "Forbidden")
		return
	}

	inst := EmptyInstanceFromRequest(r)
	if err := Client.Delete(r.Context(), inst); err != nil {
		klog.Errorf("Error deleting instance %s: %v", inst.Name, err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "Error deleting instance")
		return
	}
}

// EmptyInstanceFromRequest returns an Instance from a given request with just the ObjectMeta field set.
func EmptyInstanceFromRequest(r *http.Request) *clv1alpha2.Instance {
	instID := GetInstanceIDFromRequest(r)

	inst := &clv1alpha2.Instance{
		ObjectMeta: metav1.ObjectMeta{Name: instID, Namespace: Options.TemplatesNS},
	}
	return inst
}

// EAInstanceFromRequest parses a EAInstance from a request.
func EAInstanceFromRequest(r *http.Request) (EAInstance, error) {
	inst := EAInstance{}
	err := json.NewDecoder(r.Body).Decode(&inst)
	return inst, err
}

// InstanceSpecFromEAInstance creates an InstanceSpec from a given EAInstance.
func InstanceSpecFromEAInstance(instReq *EAInstance) clv1alpha2.InstanceSpec {
	return clv1alpha2.InstanceSpec{
		Template: clv1alpha2.GenericRef{
			Name:      instReq.Template,
			Namespace: Options.TemplatesNS,
		},
		Running: instReq.Running,
		Tenant: clv1alpha2.GenericRef{
			Name: clv1alpha2.SVCTenantName,
		},
		PrettyName: fmt.Sprintf("Exam %s", instReq.ID),
		// TODO: CustomizationUrls: instReq.CustomizationUrls,
	}
}
