import { useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (props: any) => { 
    console.log("Toast:", props); 
  };
  const dismiss = () => {};
  
  return { toast, toasts, dismiss };
}
