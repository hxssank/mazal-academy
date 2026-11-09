import React from 'react';
import { createRoot } from 'react-dom/client';
import Academy from './Academy.tsx';
import './academy.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><Academy /></React.StrictMode>);
