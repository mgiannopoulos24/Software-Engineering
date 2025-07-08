import SharedMapPage from './SharedMapPage'; // Προσέξτε το path
import React from 'react';

const Index: React.FC = () => {
  // Απλά επιστρέφει το κοινό component του χάρτη.
  // Το SharedMapPage θα δει ότι ο χρήστης είναι anonymous (currentUser === null)
  // και δεν θα εμφανίσει τα ZoneControls.
  return <SharedMapPage />;
};

export default Index;