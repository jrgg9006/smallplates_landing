"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface SignaturePadHandle {
  // Reason: devuelve el PNG (dataURL) o null si el lienzo está vacío, para que
  // el padre no suba firmas en blanco.
  toDataURL: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  // Alto del lienzo en px (CSS). El ancho es 100% del contenedor.
  height?: number;
  className?: string;
  onChange?: (isEmpty: boolean) => void;
}

// Reason: exportamos a una resolución FIJA y alta, independiente de la pantalla,
// para que un iPhone angosto genere la misma calidad de impresión que una laptop.
// El destino es ~7cm de ancho en el libro: 1600px ≈ 580 DPI (el doble de imprenta).
const EXPORT_WIDTH = 1600;
// Grosor del trazo relativo al ancho de exportación (~0.4mm de pluma a 7cm).
const STROKE_RATIO = 0.0055;
const STROKE_COLOR = "#1a1a1a";

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ height = 180, className, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const activePointerRef = useRef<number | null>(null);
    const lastRef = useRef<{ x: number; y: number } | null>(null);
    const [hasDrawn, setHasDrawn] = useState(false);

    // Configura el backing store del canvas a resolución fija de impresión.
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;

      // Backing store fijo: ancho 1600px, alto proporcional a lo que se ve.
      canvas.width = EXPORT_WIDTH;
      canvas.height = Math.round(EXPORT_WIDTH * (rect.height / rect.width));

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = EXPORT_WIDTH * STROKE_RATIO;
      ctx.strokeStyle = STROKE_COLOR;
      // Fondo transparente a propósito: no rellenamos el canvas.
    }, [height]);

    const markDrawn = (value: boolean) => {
      setHasDrawn(value);
      onChange?.(!value);
    };

    // Mapea coordenadas de pantalla (CSS px) al backing store de alta resolución.
    const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Un solo trazo a la vez: ignora dedos extra (evita saltos por multi-touch).
      if (drawingRef.current) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      activePointerRef.current = e.pointerId;
      drawingRef.current = true;
      lastRef.current = getPoint(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current || e.pointerId !== activePointerRef.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      const last = lastRef.current;
      if (!ctx || !last) return;

      const point = getPoint(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      lastRef.current = point;
      if (!hasDrawn) markDrawn(true);
    };

    const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerId !== activePointerRef.current) return;
      drawingRef.current = false;
      activePointerRef.current = null;
      lastRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // El pointer pudo haberse soltado fuera del canvas.
      }
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      markDrawn(false);
    };

    useImperativeHandle(ref, () => ({
      toDataURL: () => {
        if (!hasDrawn || !canvasRef.current) return null;
        return canvasRef.current.toDataURL("image/png");
      },
      clear: clearCanvas,
      isEmpty: () => !hasDrawn,
    }));

    return (
      <div className={className}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height,
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          className="w-full rounded-lg border border-dashed border-gray-300 bg-white cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Firma con el dedo o el mouse
          </span>
          <button
            type="button"
            onClick={clearCanvas}
            disabled={!hasDrawn}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40"
          >
            Borrar
          </button>
        </div>
      </div>
    );
  }
);

export default SignaturePad;
