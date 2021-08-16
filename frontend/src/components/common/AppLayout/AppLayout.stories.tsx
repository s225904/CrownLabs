import AppLayout, { IAppLayoutProps } from './AppLayout';
import { Story, Meta } from '@storybook/react';
import Box from '../Box';
import { Alert, Skeleton } from 'antd';
import ThemeContextProvider from '../../../contexts/ThemeContext';
import { RouteData } from '../Navbar/Navbar';
import { BarChartOutlined, QuestionOutlined } from '@ant-design/icons';

export default {
  title: 'Components/common/AppLayout',
  component: AppLayout,
  argTypes: {},
  decorators: [
    (Story: Story) => {
      return (
        <>
          <ThemeContextProvider>
            <Story />
          </ThemeContextProvider>
        </>
      );
    },
  ],
} as Meta;

const createRoute = (routes: Array<RouteData>) =>
  routes.map(r => {
    return {
      route: { ...r },
      content: (
        <div className="m-8">
          <Box
            header={{
              size: 'middle',
              center: (
                <div className="h-full flex justify-center items-center px-5">
                  <p className="md:text-2xl text-xl text-center mb-0">
                    <b>{r.name}</b>
                  </p>
                </div>
              ),
            }}
          >
            <div className="flex justify-center">
              <Alert
                className="mb-4 mt-8 mx-8 w-full"
                message="Warning"
                description="This is a temporary content"
                type="warning"
                showIcon
                closable
              />
            </div>
            <Skeleton className="px-8 pt-1" />
          </Box>
        </div>
      ),
    };
  });

const Template: Story<IAppLayoutProps> = args => <AppLayout {...args} />;

export const Default = Template.bind({});
Default.args = {
  routes: createRoute([
    { name: 'Dashboard', path: '/iframe.html' },
    { name: 'Active', path: '/active' },
    { name: 'Drive', path: 'https://nextcloud.com/' },
    { name: 'Account', path: '/account' },
  ]),
};

export const Grafana = Template.bind({});
Grafana.args = {
  routes: Default.args.routes,
  TooltipButtonData: {
    tooltipPlacement: 'left',
    tooltipTitle: 'Open Grafana Dashboard',
    icon: (
      <BarChartOutlined
        style={{ fontSize: '22px' }}
        className="flex items-center justify-center "
      />
    ),
    type: 'warning',
  },
};

export const Ticketing = Template.bind({});
Ticketing.args = {
  routes: Default.args.routes,
  TooltipButtonData: {
    tooltipPlacement: 'left',
    tooltipTitle: 'Open Ticketing',
    icon: (
      <QuestionOutlined
        style={{ fontSize: '22px' }}
        className="flex items-center justify-center "
      />
    ),
    type: 'success',
  },
  TooltipButtonLink: 'https://ticketing.crownlabs.polito.it/',
};

export const GrafanaPlusTicketing = Template.bind({});
GrafanaPlusTicketing.args = {
  routes: Default.args.routes?.concat(
    createRoute([
      {
        name: 'Ticket',
        path: 'https://ticketing.crownlabs.polito.it/',
      },
    ])
  ),
  TooltipButtonData: {
    tooltipPlacement: 'left',
    tooltipTitle: 'Statistics',
    icon: (
      <BarChartOutlined
        style={{ fontSize: '22px' }}
        className="flex items-center justify-center "
      />
    ),
    type: 'success',
  },
  TooltipButtonLink: 'https://play.grafana.org/',
};
