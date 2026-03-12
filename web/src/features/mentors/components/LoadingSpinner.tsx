import { LoaderCircle } from 'lucide-solid';

const LoadingSpinner = () => (
  <div class="flex items-center justify-center py-12">
    <div class="flex flex-col items-center gap-3">
      <LoaderCircle class="h-8 w-8 animate-spin text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Се вчитуваат податоците...</p>
    </div>
  </div>
);

export default LoadingSpinner;
