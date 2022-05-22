import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Dashboard } from "../pages/Dashboard";

export const App = () => {


  return (
    <>
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard/>} />
            <Route path="/:partnercode" element={<Dashboard/>} />
          </Routes>
      </BrowserRouter>
    </>
  );
};
