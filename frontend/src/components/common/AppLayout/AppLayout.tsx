import { FC, ReactNode, useState } from 'react';
import { Layout } from 'antd';
import Navbar from '../Navbar';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { logout } from '../../../contexts/AuthContext';
import SidebarInfo from '../SidebarInfo';
import TooltipButton from '../TooltipButton';
import Logo from '../Logo';
import './AppLayout.less';
import { RouteData } from '../Navbar/Navbar';
import { TooltipButtonData } from '../TooltipButton/TooltipButton';

const { Content } = Layout;

type routeDescriptor = {
  route: RouteData;
  content: ReactNode;
};

export interface IAppLayoutProps {
  routes: Array<routeDescriptor>;
  TooltipButtonData?: TooltipButtonData;
  TooltipButtonLink?: string;
  transparentNavbar?: boolean;
}

const AppLayout: FC<IAppLayoutProps> = ({ ...props }) => {
  const [sideLeftShow, setSideLeftShow] = useState(false);
  const {
    routes,
    transparentNavbar,
    TooltipButtonData,
    TooltipButtonLink,
  } = props;

  return (
    <BrowserRouter>
      <Layout>
        <Navbar
          logoutHandler={logout}
          routes={routes.map(r => r.route)}
          transparent={transparentNavbar}
        />
        <Content>
          <Switch>
            {routes.map(r => (
              <Route exact key={r.route.path} path={r.route.path}>
                {r.content}
              </Route>
            ))}
          </Switch>
        </Content>
        <div className="left-TooltipButton">
          <TooltipButton
            TooltipButtonData={{
              tooltipTitle: 'Show CrownLabs infos',
              tooltipPlacement: 'rightBottom',
              type: 'primary',
              icon: <Logo widthPx={30} color="white" />,
            }}
            onClick={() => setSideLeftShow(true)}
          />
        </div>
        {TooltipButtonData && (
          <div className="right-TooltipButton">
            <TooltipButton
              TooltipButtonData={{
                tooltipTitle: TooltipButtonData.tooltipTitle,
                tooltipPlacement: TooltipButtonData.tooltipPlacement,
                type: TooltipButtonData.type,
                icon: TooltipButtonData.icon,
              }}
              onClick={() => window.open(TooltipButtonLink, '_blank')}
            />
          </div>
        )}
      </Layout>
      <SidebarInfo
        visible={sideLeftShow}
        onClose={() => setSideLeftShow(false)}
        position="left"
      />
    </BrowserRouter>
  );
};

export default AppLayout;
