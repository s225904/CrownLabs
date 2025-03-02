import { FetchPolicy } from '@apollo/client';
import { Empty, Spin } from 'antd';
import Button from 'antd-button-color';
import { FC, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorContext } from '../../../errorHandling/ErrorContext';
import { ErrorTypes } from '../../../errorHandling/utils';
import {
  OwnedInstancesQuery,
  UpdatedOwnedInstancesSubscriptionResult,
  UpdateType,
  useOwnedInstancesQuery,
} from '../../../generated-types';
import { updatedOwnedInstances } from '../../../graphql-components/subscription';
import { TenantContext } from '../../../graphql-components/tenantContext/TenantContext';
import {
  comparePrettyName,
  matchK8sObject,
  replaceK8sObject,
} from '../../../k8sUtils';
import { Instance, User, WorkspaceRole } from '../../../utils';
import { makeGuiInstance, notifyStatus, sorter } from '../../../utilsLogic';
import TableInstance from './TableInstance';
import './TableInstance.less';
export interface ITableInstanceLogicProps {
  viewMode: WorkspaceRole;
  showGuiIcon: boolean;
  extended: boolean;
  user: User;
}

const fetchPolicy_networkOnly: FetchPolicy = 'network-only';

const TableInstanceLogic: FC<ITableInstanceLogicProps> = ({ ...props }) => {
  const { viewMode, extended, showGuiIcon, user } = props;
  const { makeErrorCatcher, apolloErrorCatcher, errorsQueue } =
    useContext(ErrorContext);
  const { tenantNamespace, tenantId } = user;
  const { hasSSHKeys } = useContext(TenantContext);
  const [dataInstances, setDataInstances] = useState<OwnedInstancesQuery>();
  const [sortingData, setSortingData] = useState<{
    sortingType: string;
    sorting: number;
  }>({ sortingType: '', sorting: 0 });

  const handleSorting = (sortingType: string, sorting: number) => {
    setSortingData({ sortingType, sorting });
  };

  const {
    loading: loadingInstances,
    error: errorInstances,
    subscribeToMore: subscribeToMoreInstances,
  } = useOwnedInstancesQuery({
    variables: { tenantNamespace },
    onCompleted: setDataInstances,
    fetchPolicy: fetchPolicy_networkOnly,
    onError: apolloErrorCatcher,
  });

  useEffect(() => {
    if (!loadingInstances && !errorInstances && !errorsQueue.length) {
      const unsubscribe = subscribeToMoreInstances({
        onError: makeErrorCatcher(ErrorTypes.GenericError),
        document: updatedOwnedInstances,
        variables: { tenantNamespace },
        updateQuery: (prev, { subscriptionData }) => {
          const { data } =
            subscriptionData as UpdatedOwnedInstancesSubscriptionResult;

          if (!data?.updateInstance?.instance) return prev;

          const { instance, updateType } = data?.updateInstance;
          let isPrettyNameUpdate = false;

          if (prev.instanceList?.instances) {
            let instances = [...prev.instanceList.instances];
            if (updateType === UpdateType.Deleted) {
              instances = instances.filter(matchK8sObject(instance, true));
            } else {
              const found = instances.find(matchK8sObject(instance, false));
              if (found) {
                isPrettyNameUpdate = !comparePrettyName(found, instance);
                instances = instances.map(replaceK8sObject(instance));
              } else {
                instances = [...instances, instance];
              }
            }
            prev.instanceList.instances = [...instances];
          }

          !isPrettyNameUpdate &&
            notifyStatus(
              instance.status?.phase!,
              instance,
              updateType!,
              tenantNamespace,
              WorkspaceRole.user
            );

          const newItem = { ...prev };
          setDataInstances(newItem);
          return newItem;
        },
      });
      return unsubscribe;
    }
  }, [
    loadingInstances,
    subscribeToMoreInstances,
    tenantNamespace,
    tenantId,
    errorsQueue.length,
    errorInstances,
    apolloErrorCatcher,
    makeErrorCatcher,
  ]);

  const instances =
    dataInstances?.instanceList?.instances
      ?.map((i, n) => makeGuiInstance(i, tenantId))
      .sort((a, b) =>
        sorter(
          a,
          b,
          sortingData.sortingType as keyof Instance,
          sortingData.sorting
        )
      ) || [];

  return (
    <>
      {!loadingInstances && !errorInstances && dataInstances ? (
        instances.length ? (
          <TableInstance
            showGuiIcon={showGuiIcon}
            viewMode={viewMode}
            hasSSHKeys={hasSSHKeys}
            instances={instances}
            extended={extended}
            handleSorting={handleSorting}
            showAdvanced={true}
          />
        ) : (
          <div className="w-full h-full flex-grow flex flex-wrap content-center justify-center py-5 ">
            <div className="w-full pb-10 flex justify-center">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
            </div>
            <p className="text-xl xs:text-3xl text-center px-5 xs:px-24">
              No running instances
            </p>
            <div className="w-full pb-10 flex justify-center">
              <Link to="/">
                <Button type="primary" shape="round" size="large">
                  Create Instance
                </Button>
              </Link>
            </div>
          </div>
        )
      ) : (
        <>
          <div className="flex justify-center h-full items-center">
            {loadingInstances ? (
              <Spin size="large" spinning={loadingInstances} />
            ) : (
              <>{errorInstances && <p>{errorInstances.message}</p>}</>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default TableInstanceLogic;
