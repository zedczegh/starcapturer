
/// <reference types="vite/client" />
/// <reference types="react-leaflet" />
/// <reference types="leaflet" />

declare module "react-leaflet" {
  import { MarkerProps as LeafletMarkerProps } from "react-leaflet";
  import { PopupProps as LeafletPopupProps } from "react-leaflet";
  
  // Extend the MarkerProps interface to include eventHandlers
  interface MarkerProps extends LeafletMarkerProps {
    eventHandlers?: {
      click?: () => void;
      mouseover?: () => void;
      mouseout?: () => void;
      [key: string]: any;
    };
  }

  // Extend the Popup interface with our required properties
  interface PopupProps extends LeafletPopupProps {
    maxWidth?: number;
    autoPan?: boolean;
    closeOnClick?: boolean;
    autoClose?: boolean;
  }
}

// Extend window to include global variables
declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
  __INITIAL_STATE__?: any;
}
