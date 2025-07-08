import SharedMapPage from '../SharedMapPage';
import React from 'react';

const UserPage: React.FC = () => {
  // Απλά επιστρέφει το κοινό component του χάρτη.
  // Όλη η λογική για τα δικαιώματα του user (π.χ. εμφάνιση ZoneControls)
  // γίνεται αυτόματα μέσα στο SharedMapPage μέσω του useAuth().
  return <SharedMapPage />;
};

export default UserPage;