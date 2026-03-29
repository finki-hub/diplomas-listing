import { Route, Router } from '@solidjs/router';

import { Toaster } from '@/components/ui/sonner.tsx';
import MentorsPage from '@/pages/MentorsPage';

const App = () => (
  <>
    <Router>
      <Route
        component={MentorsPage}
        path="/"
      />
      <Route
        component={MentorsPage}
        path="/mentors"
      />
    </Router>
    <Toaster position="bottom-right" />
  </>
);
export default App;
