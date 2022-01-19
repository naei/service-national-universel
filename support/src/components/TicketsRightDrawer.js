import ResizablePanel from "./ResizablePanel";

const TicketsRightDrawer = () => {
  return (
    <ResizablePanel className={`flex-grow-0 flex-shrink-0 border-l-2 z-10 overflow-hidden flex w-80`} position="right" name="admin-tickets-right-panel">
      <div className="relative flex flex-col pr-2 overflow-hidden w-full"></div>
    </ResizablePanel>
  );
};

export default TicketsRightDrawer;
