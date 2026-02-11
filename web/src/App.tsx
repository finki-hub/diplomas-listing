import { Route, Router } from '@solidjs/router';

import MentorsPage from '@/pages/MentorsPage';

const App = () => (
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
);

export default App;
