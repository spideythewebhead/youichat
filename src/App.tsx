import React from 'react';
import { AppBar } from './components/AppBar';
import { ElevatedButton, TextButton } from './components/Button';
import { Column, Row } from './components/Flex';
import { useAuthState, useProfileNotifier } from './hooks/useAuth';
import { Switch, Route, useHistory, Redirect } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { IconButton } from './components/IconButton';
import { LogoutIcon } from '@heroicons/react/solid';
import { client } from './db';
import { MainPage } from './pages/main_page/MainPage';
import { SetNicknamePage } from './pages/SetNicknamePage';
import { MissingPublicData } from './models/profile';
import { useFilePicker } from './hooks/useFilePicker';
import { Avatar } from './components/Avatar';
import { useCacheDb } from './utils/web_db';
import { MessageReceivedProvider } from './hooks/useMessageReceived';

function App() {
  const cacheDb = useCacheDb();
  const history = useHistory();
  const logState = useAuthState();
  const profile = useProfileNotifier();

  const filePicker = useFilePicker();

  return (
    <MessageReceivedProvider>
      <Column crossAxis="items-stretch">
        <AppBar>
          <Row
            mainAxis="justify-between"
            crossAxis="items-center"
            className="h-full gap-1"
          >
            {profile.publicData && (
              <Row className="gap-2">
                <div>
                  <span>Welcome </span>
                  <span className="hover:underline cursor-default">
                    {profile.publicData?.user?.nickname}
                  </span>
                </div>

                <Avatar
                  imageUrl={profile.publicData?.user?.image_url}
                  onClick={async () => {
                    const id = profile.publicData?.user?.id;

                    if (!id) return;

                    const file = await filePicker(/\.(png|jpe?g)$/);

                    if (file) {
                      profile.uploadProfilePicture(file);
                    }
                  }}
                />
              </Row>
            )}

            <div></div>

            {logState.session && (
              <IconButton
                title="Logout"
                onClick={async () => {
                  const pushId = window.localStorage.getItem('push_id');
                  await Promise.allSettled([
                    cacheDb?.clear(),
                    pushId &&
                      client.from('push_tokens').delete().eq('id', pushId),
                    client.auth.signOut(),
                  ]);
                }}
              >
                <LogoutIcon className="h-6 w-6 p-1" />
              </IconButton>
            )}

            {!logState.session && (
              <div>
                <ElevatedButton onClick={() => history.push('/login')}>
                  Log In
                </ElevatedButton>
                <TextButton onClick={() => history.push('/signup')}>
                  Sign Up?
                </TextButton>
              </div>
            )}
          </Row>
        </AppBar>

        <Switch>
          <Route
            exact
            path="/"
            render={() => {
              if (!logState.session || logState.state === 'SIGNED_OUT') {
                history.replace('/login');
                return;
              }

              if (profile.publicData instanceof MissingPublicData) {
                return <Redirect to="/complete-nickname" />;
              }

              if (!profile.publicData) {
                return <></>;
              }

              return <MainPage />;
            }}
          />
          {logState.session && (
            <Route path="/complete-nickname" component={SetNicknamePage} />
          )}
          {!logState.session && (
            <>
              <Route path="/login" component={LoginPage} />
              <Route path="/signup" component={SignUpPage} />
            </>
          )}

          <Redirect to="/" />
        </Switch>
      </Column>
    </MessageReceivedProvider>
  );
}

export default App;
