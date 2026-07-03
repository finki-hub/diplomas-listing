import { Route, Router } from '@solidjs/router';

import { Toaster } from '@/components/ui/sonner.tsx';
import { DIPLOMAS_SECTION, MASTERS_SECTION } from '@/features/mentors/section';
import MentorsPage from '@/pages/MentorsPage';

// Distinct wrapper components per section guarantee a remount (fresh data
// fetch and URL-state read) when switching between the two routes.
const DiplomasPage = () => <MentorsPage config={DIPLOMAS_SECTION} />;
const MastersPage = () => <MentorsPage config={MASTERS_SECTION} />;

const App = () => (
  <>
    <Router>
      <Route
        component={DiplomasPage}
        path="/"
      />
      <Route
        component={DiplomasPage}
        path="/mentors"
      />
      <Route
        component={MastersPage}
        path="/masters"
      />
    </Router>
    <Toaster position="bottom-right" />
  </>
);

export default App;
