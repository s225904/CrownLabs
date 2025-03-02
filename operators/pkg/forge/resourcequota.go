// Copyright 2020-2022 Politecnico di Torino
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

package forge

import (
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"

	clv1alpha1 "github.com/netgroup-polito/CrownLabs/operators/api/v1alpha1"
	clv1alpha2 "github.com/netgroup-polito/CrownLabs/operators/api/v1alpha2"
)

const (
	// InstancesCountKey -> The key for accessing at the total number of instances in the corev1.ResourceList map.
	InstancesCountKey = "count/instances.crownlabs.polito.it"

	// CapInstance -> The cap number of instances that can be requested by a Tenant.
	CapInstance = 10
)

var (
	// CapCPU -> The cap amount of CPU cores that can be requested by a Tenant.
	CapCPU = *resource.NewQuantity(25, resource.DecimalSI)

	// CapMemory -> The cap amount of RAM memory that can be requested by a Tenant.
	CapMemory = *resource.NewScaledQuantity(50, resource.Giga)
)

// TenantResourceList forges the Tenant Resource Quota as the value defined in TenantSpec, if any, otherwise it keeps the sum of all quota for each workspace.
func TenantResourceList(workspaces []clv1alpha1.Workspace, override *clv1alpha2.TenantResourceQuota) clv1alpha2.TenantResourceQuota {
	// if an override value is defined it is used as return parameter.
	if override != nil {
		return *override.DeepCopy()
	}
	var quota clv1alpha2.TenantResourceQuota

	// sum all quota for each existing workspace
	for i := range workspaces {
		quota.CPU.Add(workspaces[i].Spec.Quota.CPU)
		quota.Memory.Add(workspaces[i].Spec.Quota.Memory)
		quota.Instances += workspaces[i].Spec.Quota.Instances
	}

	quota.CPU = CapResourceQuantity(quota.CPU, CapCPU)
	quota.Memory = CapResourceQuantity(quota.Memory, CapMemory)
	quota.Instances = CapIntegerQuantity(quota.Instances, CapInstance)

	return quota
}

// TenantResourceQuotaSpec forges the Resource Quota spec as the value defined in TenantStatus.
func TenantResourceQuotaSpec(quota *clv1alpha2.TenantResourceQuota) corev1.ResourceList {
	return corev1.ResourceList{
		corev1.ResourceLimitsCPU:      quota.CPU,
		corev1.ResourceLimitsMemory:   quota.Memory,
		corev1.ResourceRequestsCPU:    quota.CPU,
		corev1.ResourceRequestsMemory: quota.Memory,
		InstancesCountKey:             *resource.NewQuantity(int64(quota.Instances), resource.DecimalSI),
	}
}
