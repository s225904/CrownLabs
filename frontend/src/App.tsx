import { useContext, useEffect, useState } from 'react';
import './App.css';
import { AuthContext } from './contexts/AuthContext';
import { Alert, Skeleton } from 'antd';
import Box from './components/common/Box';
import AppLayout from './components/common/AppLayout';
import ThemeContextProvider from './contexts/ThemeContext';
import { BarChartOutlined } from '@ant-design/icons';

function App() {
  const { userId, token } = useContext(AuthContext);
  const [, setInstances] = useState<string[] | undefined>(undefined);
  useEffect(() => {
    if (userId) {
      fetch(
        `https://apiserver.crownlabs.polito.it/apis/crownlabs.polito.it/v1alpha2/namespaces/tenant-${userId.replaceAll(
          '.',
          '-'
        )}/instances`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
        .then(res => res.json())
        .then(body => {
          if (body.items) {
            setInstances(body.items.map((item: any) => item.metadata.name));
          }
        })
        .catch(err => {
          console.error('ERROR WHEN GETTING INSTANCES', err);
        });
    }
  }, [userId, token]);
  return (
    <ThemeContextProvider>
      <AppLayout
        TooltipButtonLink="https://play.grafana.org/"
        TooltipButtonData={{
          tooltipPlacement: 'left',
          tooltipTitle: 'Statistics',
          icon: (
            <BarChartOutlined
              style={{ fontSize: '22px' }}
              className="flex items-center justify-center "
            />
          ),
          type: 'success',
        }}
        routes={[
          { name: 'Dashboard', path: '/' },
          { name: 'Active', path: '/active' },
          { name: 'Drive', path: 'https://nextcloud.com/', externalLink: true },
          { name: 'Account', path: '/account' },
        ].map(r => {
          return {
            route: {
              ...r,
            },
            content: (
              <div className="m-8 ">
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
        })}
      />
    </ThemeContextProvider>
  );
}

export default App;
