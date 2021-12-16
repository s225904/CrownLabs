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
	"errors"
	"flag"
	"net/http"
	"strings"

	"github.com/ryanuber/go-glob"
	"k8s.io/klog/v2"
)

type options struct {
	AllowedIPs   string
	TemplatesNS  string
	ListenerAddr string
}

// Options object holds all the instanceset parameters.
var Options options

// Initialize flags and associate each parameter to the given options object.
func (o *options) Init() {
	flag.StringVar(&o.ListenerAddr, "address", ":8888", "[address]:port of the landing server")
	flag.StringVar(&o.TemplatesNS, "templates-namespace", "workspace-exams", "Namespace of CrownLabs Templates that will be listed")
	flag.StringVar(&o.AllowedIPs, "allowed-ips", "", "Comma separated list of IPs that are allowed to create new instances")
	klog.InitFlags(nil)
}

// Parse and normalize options.
func (o *options) Parse() {
	flag.Parse()
}

// Perform general flags validation.
func (o *options) Validate() error {
	if o.TemplatesNS == "" {
		return errors.New("missing argument: templates-namespace")
	}

	if o.AllowedIPs == "" {
		klog.Warningln("No whitelist IPs have been specified: all IPs are allowed")
	}

	return nil
}

// AllowedIPs contains a list of IPs that are allowed to create new instances.
type AllowedIPs string

// CheckAllowedIP checks if the given IP is allowed within the AllowedIPs.
func (o *options) CheckAllowedIP(r *http.Request) bool {
	if o.AllowedIPs == "" {
		return true
	}

	for _, allowedIP := range strings.Split(o.AllowedIPs, ",") {
		if glob.Glob(allowedIP, r.RemoteAddr) {
			return true
		}
	}

	return false
}
