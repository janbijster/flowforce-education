import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { ConnectOption, ConnectOptionConnection } from "@/lib/api";
import { Cross2Icon } from "@radix-ui/react-icons";

interface EditableConnectOption extends Omit<ConnectOption, 'id' | 'created_at' | 'updated_at'> {
  id: number | string;
  isNew?: boolean;
}

interface ConnectQuestionLayoutEditorProps {
  options: EditableConnectOption[];
  connections: Array<[number, number]>; // [from_option_id, to_option_id]
  onOptionsChange: (options: EditableConnectOption[]) => void;
  onConnectionsChange: (connections: Array<[number, number]>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function ConnectQuestionLayoutEditor({
  options,
  connections,
  onOptionsChange,
  onConnectionsChange,
  open,
  onOpenChange,
}: ConnectQuestionLayoutEditorProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<number | string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<number | string | null>(null);
  const [draggingOptionId, setDraggingOptionId] = useState<number | string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === selectedOptionId);

  // Convert normalized position (0-1) to pixel position
  const getPixelPosition = (option: EditableConnectOption) => ({
    x: option.position_x * CANVAS_WIDTH,
    y: option.position_y * CANVAS_HEIGHT,
  });

  // Convert pixel position to normalized position (0-1)
  const getNormalizedPosition = (x: number, y: number) => ({
    x: Math.max(0, Math.min(1, x / CANVAS_WIDTH)),
    y: Math.max(0, Math.min(1, y / CANVAS_HEIGHT)),
  });

  const handleOptionClick = (optionId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (connectingFrom) {
      // Complete connection
      if (connectingFrom !== optionId) {
        const fromId = typeof connectingFrom === 'number' ? connectingFrom : connectingFrom;
        const toId = typeof optionId === 'number' ? optionId : optionId;
        
        // Check if connection already exists
        const connectionExists = connections.some(([from, to]) => 
          (from === fromId && to === toId) || (from === toId && to === fromId)
        );
        
        if (!connectionExists) {
          onConnectionsChange([...connections, [fromId as number, toId as number]]);
        }
      }
      setConnectingFrom(null);
    } else {
      setSelectedOptionId(optionId);
    }
  };

  const handleStartConnection = (optionId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingFrom(optionId);
    setSelectedOptionId(null);
  };

  const handleDragStart = (optionId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    const option = options.find(opt => opt.id === optionId);
    if (!option) return;
    
    const pixelPos = getPixelPosition(option);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDraggingOptionId(optionId);
    setDragOffset({
      x: e.clientX - rect.left - pixelPos.x,
      y: e.clientY - rect.top - pixelPos.y,
    });
  };

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (!draggingOptionId || !dragOffset || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    const normalized = getNormalizedPosition(newX, newY);
    
    onOptionsChange(
      options.map(opt =>
        opt.id === draggingOptionId
          ? { ...opt, position_x: normalized.x, position_y: normalized.y }
          : opt
      )
    );
  }, [draggingOptionId, dragOffset, options, onOptionsChange]);

  const handleMouseUp = useCallback(() => {
    setDraggingOptionId(null);
    setDragOffset(null);
  }, []);

  // Add mouse move and up listeners for dragging
  useEffect(() => {
    if (!draggingOptionId || !dragOffset) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingOptionId || !dragOffset || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      const normalized = getNormalizedPosition(newX, newY);
      onOptionsChange(
        options.map(opt =>
          opt.id === draggingOptionId
            ? { ...opt, position_x: normalized.x, position_y: normalized.y }
            : opt
        )
      );
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingOptionId, dragOffset, options, onOptionsChange, handleMouseUp]);

  const handleDeleteConnection = (fromId: number, toId: number) => {
    onConnectionsChange(
      connections.filter(([from, to]) => !(from === fromId && to === toId))
    );
  };

  const handleUpdateOption = (field: 'text' | 'position_x' | 'position_y', value: string | number) => {
    if (!selectedOptionId) return;
    onOptionsChange(
      options.map(opt =>
        opt.id === selectedOptionId ? { ...opt, [field]: value } : opt
      )
    );
  };

  // Get connection line coordinates
  const getConnectionLine = (fromId: number, toId: number) => {
    const fromOption = options.find(opt => opt.id === fromId);
    const toOption = options.find(opt => opt.id === toId);
    if (!fromOption || !toOption) return null;
    
    const fromPos = getPixelPosition(fromOption);
    const toPos = getPixelPosition(toOption);
    
    return {
      x1: fromPos.x,
      y1: fromPos.y,
      x2: toPos.x,
      y2: toPos.y,
    };
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Connect Question Layout</SheetTitle>
          <SheetDescription>
            Drag options to position them, click "Connect" then click another option to create connections.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel: Properties & Lists */}
          <div className="space-y-4">
            {/* Selected Option Properties */}
            {selectedOption && (
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Edit Option</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedOptionId(null)}
                  >
                    <Cross2Icon className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Text</label>
                  <input
                    className="w-full rounded-md border px-2 py-1 text-sm"
                    value={selectedOption.text}
                    onChange={(e) => handleUpdateOption('text', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">X Position</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="w-full rounded-md border px-2 py-1 text-sm"
                      value={selectedOption.position_x.toFixed(2)}
                      onChange={(e) => handleUpdateOption('position_x', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Y Position</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="w-full rounded-md border px-2 py-1 text-sm"
                      value={selectedOption.position_y.toFixed(2)}
                      onChange={(e) => handleUpdateOption('position_y', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                {selectedOption.image && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Image</label>
                    <img src={selectedOption.image} alt={selectedOption.text} className="w-full h-auto rounded" />
                  </div>
                )}
              </div>
            )}

            {/* Options List */}
            <div className="rounded-md border">
              <div className="border-b p-2 text-sm font-medium">Options</div>
              <div className="p-2 space-y-1 max-h-40 overflow-auto">
                {options.map((option) => {
                  const pixelPos = getPixelPosition(option);
                  return (
                    <div
                      key={option.id}
                      className={`p-2 rounded text-xs cursor-pointer hover:bg-accent ${
                        selectedOptionId === option.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedOptionId(option.id)}
                    >
                      <div className="font-medium truncate">{option.text || 'Untitled'}</div>
                      <div className="text-muted-foreground">
                        ({pixelPos.x.toFixed(0)}, {pixelPos.y.toFixed(0)})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connections List */}
            <div className="rounded-md border">
              <div className="border-b p-2 text-sm font-medium">Connections</div>
              <div className="p-2 space-y-1 max-h-40 overflow-auto">
                {connections.length > 0 ? (
                  connections.map(([fromId, toId], idx) => {
                    const fromOption = options.find(opt => opt.id === fromId);
                    const toOption = options.find(opt => opt.id === toId);
                    if (!fromOption || !toOption) return null;
                    
                    return (
                      <div
                        key={`${fromId}-${toId}-${idx}`}
                        className="flex items-center justify-between p-2 rounded text-xs hover:bg-accent"
                      >
                        <span>
                          {fromOption.text || 'Untitled'} → {toOption.text || 'Untitled'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteConnection(fromId, toId)}
                        >
                          <Cross2Icon className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground p-2">No connections</div>
                )}
              </div>
            </div>

            {/* Connection Mode Indicator */}
            {connectingFrom && (
              <div className="rounded-md border border-primary bg-primary/10 p-3">
                <p className="text-sm font-medium text-primary">
                  Click an option to connect to "{options.find(opt => opt.id === connectingFrom)?.text || 'selected option'}"
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => setConnectingFrom(null)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel: Canvas */}
          <div className="lg:col-span-2">
            <div className="rounded-md border p-4">
              <div
                ref={canvasRef}
                className="relative bg-muted rounded-md"
                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                onMouseMove={handleDrag}
                onMouseUp={handleMouseUp}
                onClick={() => {
                  if (connectingFrom) {
                    setConnectingFrom(null);
                  } else {
                    setSelectedOptionId(null);
                  }
                }}
              >
                {/* SVG overlay for connections */}
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                >
                  {connections.map(([fromId, toId], idx) => {
                    const line = getConnectionLine(fromId, toId);
                    if (!line) return null;
                    return (
                      <line
                        key={`${fromId}-${toId}-${idx}`}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-primary"
                      />
                    );
                  })}
                  {/* Preview connection line when hovering over option while connecting */}
                  {connectingFrom && (() => {
                    // Find the option being hovered (we'll use mouse position or selected option)
                    const hoveredOptionId = selectedOptionId && selectedOptionId !== connectingFrom ? selectedOptionId : null;
                    if (!hoveredOptionId) return null;
                    
                    const line = getConnectionLine(
                      connectingFrom as number,
                      hoveredOptionId as number
                    );
                    if (!line) return null;
                    return (
                      <line
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="text-primary opacity-50"
                      />
                    );
                  })()}
                </svg>

                {/* Options as draggable cards */}
                {options.map((option) => {
                  const pixelPos = getPixelPosition(option);
                  const isSelected = selectedOptionId === option.id;
                  const isConnectingFrom = connectingFrom === option.id;
                  
                  return (
                    <div
                      key={option.id}
                      className={`absolute cursor-move rounded-md border p-2 bg-background shadow-sm min-w-[100px] select-none ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      } ${isConnectingFrom ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      style={{
                        left: `${pixelPos.x}px`,
                        top: `${pixelPos.y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={(e) => handleOptionClick(option.id, e)}
                      onMouseDown={(e) => handleDragStart(option.id, e)}
                    >
                      <div className="text-sm font-medium select-none">{option.text || 'Untitled'}</div>
                      {option.image && (
                        <img
                          src={option.image}
                          alt={option.text}
                          className="mt-1 max-w-[80px] h-auto rounded"
                        />
                      )}
                      <div className="mt-1 flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartConnection(option.id, e);
                          }}
                        >
                          Connect
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

