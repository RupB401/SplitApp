// theme
import ThemeProvider from './theme';
import Router from './routes';
import { GoogleOAuthProvider } from '@react-oauth/google';


function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
