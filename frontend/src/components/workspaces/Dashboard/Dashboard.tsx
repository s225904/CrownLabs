import { FC, useState } from 'react';
import { Row, Col } from 'antd';
import { WorkspaceContainer } from '../WorkspaceContainer';
import { WorkspaceWelcome } from '../WorkspaceWelcome';
import { WorkspaceGrid } from '../Grid/WorkspaceGrid';
import data from '../FakeData';
export interface IDashboardProps {
  workspaceIds: string[];
}

const Dashboard: FC<IDashboardProps> = ({ ...props }) => {
  const [selectedWsId, setSelectedWs] = useState(-1);
  const { workspaceIds } = props;
  const workspace = data.find(workspace => workspace.id === selectedWsId);
  // useEffect(() => {
  //   // controllo che ci sia in locale e se non c'è
  //   // fetch il workspace corrispondente e lo salvo in locale
  //   // mi prendo i dati necessari
  //   // setto il workspace
  // }, [selectedWsId]);

  return (
    <Row className="h-full py-10 flex">
      <Col span={0} lg={1} xxl={2}></Col>
      <Col span={24} lg={8} xxl={8} className="pr-4 px-4 py-5 lg:h-full flex">
        <div className="flex-auto lg:overflow-x-hidden overflow-auto scrollbar">
          <WorkspaceGrid
            selectedWs={selectedWsId}
            workspaceItems={workspaceIds.map((wk, idx) => ({
              id: idx,
              title: wk,
            }))}
            onClick={setSelectedWs}
          />
        </div>
      </Col>
      <Col span={24} lg={14} xxl={12} className="px-4 flex flex-auto">
        {workspace ? (
          <WorkspaceContainer workspace={workspace} />
        ) : (
          <WorkspaceWelcome />
        )}
      </Col>
      <Col span={0} lg={1} xxl={2}></Col>
    </Row>
  );
};

export default Dashboard;
