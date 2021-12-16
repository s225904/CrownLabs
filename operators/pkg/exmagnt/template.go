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

package exmagnt

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	clv1alpha2 "github.com/netgroup-polito/CrownLabs/operators/api/v1alpha2"
)

// EATemplate represents a Template within the exmagnt.
type EATemplate struct {
	Name       string `json:"name"`
	PrettyName string `json:"prettyName"`
	CreatedAt  string `json:"createdAt"`
}

// EATemplateHandler is the handler for the EATemplate.
func EATemplateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		fmt.Fprintf(w, "Method not allowed")
		return
	}

	templates := clv1alpha2.TemplateList{}
	if err := Client.List(r.Context(), &templates, client.InNamespace(Options.TemplatesNS)); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		klog.Error(err)
		return
	}

	agentTemplates := make([]EATemplate, len(templates.Items))
	for i := range templates.Items {
		agentTemplates[i] = EATemplate{
			Name:       templates.Items[i].Name,
			PrettyName: templates.Items[i].Spec.PrettyName,
			CreatedAt:  templates.Items[i].CreationTimestamp.Format(time.RFC3339),
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(agentTemplates); err != nil {
		klog.Error(err)

		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Internal server error")
	}
}
