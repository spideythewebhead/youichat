import React from 'react';
import { AppBar } from './components/AppBar';
import { ElevatedButton, TextButton } from './components/Button';
import { Column, Row } from './components/Flex';
import { useAuth, useProfile } from './hooks/useAuth';
import { Switch, Route, useHistory, Redirect } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { IconButton } from './components/IconButton';
import { LogoutIcon } from '@heroicons/react/solid';
import { client } from './db';
import { MainPage } from './pages/main_page/MainPage';
import { SetNicknamePage } from './pages/SetNicknamePage';
import { useFilePicker } from './hooks/useFilePicker';
import { Avatar } from './components/Avatar';
import { useCacheDb } from './utils/web_db';
import { MessageReceivedProvider } from './hooks/useMessageReceived';
import { ProfileCompletionState } from './models/profile';

function App() {
  const cacheDb = useCacheDb();
  const history = useHistory();
  const authState = useAuth();
  const profile = useProfile();

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
            {profile.user && (
              <Row className="gap-2">
                <div>
                  <span>Welcome </span>
                  <span className="hover:underline cursor-default">
                    {profile.user.nickname}
                  </span>
                </div>

                <Avatar
                  imageUrl={profile.user.image_url}
                  onClick={async () => {
                    const file = await filePicker(/\.(png|jpe?g)$/);

                    if (file) {
                      profile.uploadProfilePicture(file);
                    }
                  }}
                />
              </Row>
            )}

            <div></div>

            {profile.user && (
              <IconButton
                title="Logout"
                onClick={async () => {
                  const pushId = window.localStorage.getItem('push_id');

                  await Promise.allSettled([
                    cacheDb?.clear(),
                    pushId &&
                      client.from('push_tokens').delete().eq('id', pushId),
                  ]);

                  await client.auth.signOut();

                  history.replace('/login');
                }}
              >
                <LogoutIcon className="h-6 w-6 p-1" />
              </IconButton>
            )}

            {!authState.session && (
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
              if (!authState.session || authState.state === 'SIGNED_OUT') {
                return <Redirect to="/login" />;
              }

              if (
                profile.profileCompletionState ===
                ProfileCompletionState.pendingCompletion
              ) {
                return <Redirect to="/complete-nickname" />;
              }

              if (!profile.user) {
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    Fetching your data..
                  </div>
                );
              }

              return <MainPage />;
            }}
          />

          {authState.session && (
            <Route path="/complete-nickname" component={SetNicknamePage} />
          )}

          {!authState.session && <Route path="/login" component={LoginPage} />}
          {!authState.session && (
            <Route path="/signup" component={SignUpPage} />
          )}

          <Redirect to="/" />
        </Switch>
      </Column>
    </MessageReceivedProvider>
  );
}

export default App;
