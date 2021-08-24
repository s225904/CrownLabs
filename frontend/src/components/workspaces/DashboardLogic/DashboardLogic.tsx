import React, { useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTenantQuery } from '../../../generated-types';
import Dashboard from '../Dashboard/Dashboard';

function DashboardLogic() {
  const { userId } = useContext(AuthContext);
  const { data: tenant, loading, error } = useTenantQuery({
    variables: { tenantId: userId ?? '' },
  });

  return (
    <div>
      {!loading && tenant && !error && (
        <>
          <Dashboard
            workspaceIds={
              tenant.tenant?.spec?.workspaces?.map(
                workspace => workspace?.workspaceRef?.workspaceId as string
              ) ?? []
            }
          />
        </>
      )}
    </div>
  );
}

export default DashboardLogic;
