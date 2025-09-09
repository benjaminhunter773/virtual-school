/**
 * Mesh Context - React Context for sharing mesh network state
 */

import React, { createContext, useContext } from 'react';

export const MeshContext = createContext({
  meshNetwork: null,
  signalProtocol: null,
  messageRouter: null,
  isInitialized: false,
});

export const useMesh = () => {
  const context = useContext(MeshContext);
  if (!context) {
    throw new Error('useMesh must be used within a MeshContext.Provider');
  }
  return context;
};