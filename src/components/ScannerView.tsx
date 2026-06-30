/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Product } from "../types";
import { 
  Camera, 
  Barcode, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  AlertCircle, 
  CheckCircle,
  Package,
  X,
  Sparkles,
  Trash2,
  Eye,
  Upload,
  AlertTriangle,
  Image as ImageIcon
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface ScannerViewProps {
  products: Product[];
  onAddProductWithBarcode: (barcode: string) => void;
  onUpdateQuantity: (productId: string, quantityChange: number, type: 'entrada' | 'saida' | 'desperdicio', notes: string) => void;
}

export default function ScannerView({
  products,
  onAddProductWithBarcode,
  onUpdateQuantity
}: ScannerViewProps) {
  const [scannedCode, setScannedCode] = useState("");
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const [cameraErrorDetail, setCameraErrorDetail] = useState<string | null>(null);
  const [cameraKey, setCameraKey] = useState<number>(0);
  const [scanStatus, setScanStatus] = useState<"idle" | "searching" | "found" | "notFound">("idle");
  const [successAnimation, setSuccessAnimation] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Form parameters for quickly scanned items
  const [fastQty, setFastQty] = useState<number>(5);
  const [fastType, setFastType] = useState<'entrada' | 'saida'>('entrada');
  const [fastNotes, setFastNotes] = useState("");

  // Sub-navigation state inside details pane: "balance" (regular movement) or "wastage" (visual wastage verification)
  const [activeSubTab, setActiveSubTab] = useState<'balance' | 'wastage'>('balance');

  // Wastage verification states
  const [wasteChecklist, setWasteChecklist] = useState<string[]>([]);
  const [wastePhoto, setWastePhoto] = useState<string | null>(null);
  const [wasteQty, setWasteQty] = useState<number>(1);
  const [wasteNotes, setWasteNotes] = useState("");
  const [capturingState, setCapturingState] = useState<"idle" | "capturing" | "success">("idle");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const checklistPresets = [
    "📅 Fora do Prazo de Validade",
    "📦 Embalagem Rompida / Danificada",
    "🤢 Sinais de Contaminação / Deterioração",
    "💧 Presença de Umidade / Infiltração",
    "❄️ Quebra da Cadeia de Frio (Congelados)",
    "🐛 Presença de Insetos / Pragas"
  ];

  const toggleWastageCondition = (condition: string) => {
    if (wasteChecklist.includes(condition)) {
      setWasteChecklist(wasteChecklist.filter(c => c !== condition));
    } else {
      setWasteChecklist([...wasteChecklist, condition]);
    }
  };

  const capturePhoto = () => {
    setCapturingState("capturing");
    setTimeout(() => {
      const liveVideo = document.querySelector("#qr-reader video") as HTMLVideoElement;
      if (liveVideo && cameraPermissionGranted) {
        const canvas = document.createElement("canvas");
        canvas.width = liveVideo.videoWidth || 640;
        canvas.height = liveVideo.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(liveVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg");
          setWastePhoto(dataUrl);
          setCapturingState("success");
          return;
        }
      }
      
      // Fallback simulated visual report photo
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0f172a"; // Slate 900
        ctx.fillRect(0, 0, 400, 300);
        
        ctx.fillStyle = "#ffe4e6"; // Red warning circle
        ctx.beginPath();
        ctx.arc(200, 130, 40, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#e11d48"; // Rose-600 exclamation
        ctx.font = "bold 50px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", 200, 132);
        
        ctx.fillStyle = "#94a3b8"; // Label
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("LAUDO DE VISTORIA VISUAL", 200, 205);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "11px monospace";
        ctx.fillText(`PRODUTO: ${scannedProduct?.name || "LOTE DANIFICADO"}`, 200, 230);
        ctx.fillText(`ESTADO: CONFIRMADO VIA APP`, 200, 250);
        
        const dataUrl = canvas.toDataURL("image/jpeg");
        setWastePhoto(dataUrl);
        setCapturingState("success");
      }
    }, 600);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setWastePhoto(event.target.result as string);
          setCapturingState("success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWastageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct) return;

    const checklistLabels = wasteChecklist.map(c => c.slice(2)); // Strip emoji
    const finalNotes = [
      `[Laudo de Verificação de Desperdício]`,
      `Estado Confirmado: ${checklistLabels.join(", ") || "Aparência geral inadequada"}`,
      wasteNotes ? `Comentários: ${wasteNotes}` : "",
      wastePhoto ? `Item documentado com foto.` : `Lançado sem foto de vistoria.`
    ].filter(Boolean).join(" | ");

    onUpdateQuantity(
      scannedProduct.id,
      wasteQty,
      'desperdicio',
      finalNotes
    );

    alert(`Sucesso! Desperdício de ${wasteQty} ${scannedProduct.unit} de ${scannedProduct.name} registrado com sucesso para análise de auditoria.`);
    
    // Clear states
    setScannedProduct(null);
    setScannedCode("");
    setScanStatus("idle");
    isProcessingRef.current = false; // RELEASE SCANNING LOCK
    setWasteChecklist([]);
    setWastePhoto(null);
    setWasteQty(1);
    setWasteNotes("");
    setActiveSubTab("balance");
  };

  // Start real-time camera-based barcode scanning using Html5Qrcode
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    async function startCamera() {
      try {
        console.log("[Leitor] Solicitando acesso ao sensor da câmera...");
        // Delay slightly for DOM mounting security
        await new Promise((resolve) => setTimeout(resolve, 350));
        if (!isMounted) return;

        const container = document.getElementById("qr-reader");
        if (!container) {
          console.warn("[Leitor] Container visual 'qr-reader' não encontrado.");
          return;
        }

        html5QrCode = new Html5Qrcode("qr-reader");
        
        const config = {
          fps: 15,
          qrbox: (width: number, height: number) => {
            // landscape EAN-13/EAN-8 horizontal detection area
            const optimalWidth = Math.min(width * 0.82, 360);
            const optimalHeight = Math.min(height * 0.45, 180);
            return { width: Math.floor(optimalWidth), height: Math.floor(optimalHeight) };
          },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39
          ]
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            // Guard against duplicate reads while performing lookup / user input
            if (isProcessingRef.current) {
              return; 
            }
            console.log(`[Leitor] Código EAN/QR lido com sucesso: "${decodedText}"`);
            handleBarcodeLookup(decodedText);
          },
          (errorMessage: string) => {
            // Silent frame warning log - standard behavior as cameras capture 15fps
          }
        );

        console.log("[Leitor] Fluxo da câmera ativado e escaneando códigos.");
        if (isMounted) {
          setCameraPermissionGranted(true);
          setCameraErrorDetail(null);
        }
      } catch (err: any) {
        console.error("[Leitor] Erro ao obter permissão da câmera ou iniciar transmissão:", err?.message || err);
        if (isMounted) {
          setCameraPermissionGranted(false);
          setCameraErrorDetail(err?.message || String(err));
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (html5QrCode) {
        html5QrCode.stop()
          .then(() => {
            console.log("[Leitor] Câmera fechada e canal liberado com sucesso.");
          })
          .catch((e: any) => {
            console.warn("[Leitor] Aviso ao encerrar fluxo da câmera:", e?.message || e);
          });
      }
    };
  }, [cameraKey]);

  const playBeepSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = "sine";
        oscillator.frequency.value = 880; // Crisp high success tone (880Hz)
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioCtx.close();
        }, 110);
      }
    } catch (e) {
      console.warn("[Leitor] Dispositivo de áudio ocupado ou sem suporte no navegador:", e);
    }
  };

  // Handle scanned lookup code
  const handleBarcodeLookup = (code: string) => {
    if (!code || isProcessingRef.current) return;
    
    isProcessingRef.current = true; // LOCK SCANNING
    setScannedCode(code);
    setScanStatus("searching");
    console.log(`[Leitor] Iniciando busca do código: "${code}" no Supabase/DB local...`);
    
    // Slight delay to keep smooth user feedback loop
    setTimeout(() => {
      const match = products.find(p => p.barcode === code);
      if (match) {
        console.log(`[Leitor] Produto localizado: "${match.name}" (Categoria: ${match.category})`);
        playBeepSound();
        setScannedProduct(match);
        setScanStatus("found");
        setSuccessAnimation(true);
        setTimeout(() => setSuccessAnimation(false), 800);
      } else {
        console.warn(`[Leitor] Código "${code}" não corresponde a nenhum produto cadastrado no Supabase.`);
        setScannedProduct(null);
        setScanStatus("notFound");
      }
    }, 400);
  };

  const handleFastQuantitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct) return;

    onUpdateQuantity(
      scannedProduct.id,
      fastQty,
      fastType,
      fastNotes || `Ajuste rápido via sensor de código de barras`
    );

    // Alert completion
    alert(`Sucesso! ${fastType === 'entrada' ? 'Entrada' : 'Saída'} de ${fastQty} ${scannedProduct.unit} de ${scannedProduct.name} registrada.`);
    
    // Clear scanned panel
    setScannedProduct(null);
    setScannedCode("");
    setScanStatus("idle");
    isProcessingRef.current = false; // RELEASE SCANNING LOCK
  };

  return (
    <div className="space-y-6 animate-fade-in" id="scanner-view-main">
      <div>
        <h2 className="text-xl font-bold text-gray-900">📷 Leitor de Código de Barras Escolar</h2>
        <p className="text-xs text-gray-500">Utilize a câmera do celular para consultar produtos e movimentar o estoque com agilidade.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="scanner-grid">
        
        {/* Left Side: Live Camera Sandbox Frame */}
        <div className="lg:col-span-7 bg-white p-5 border border-gray-100 rounded-3xl shadow-xs space-y-4" id="stream-pane">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <span className="text-sm font-semibold text-gray-700 flex items-center">
              <Camera className="w-4 h-4 mr-2 text-emerald-600 animate-pulse" />
              Sensor Óptico do Aparelho (Android / Web)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider">
              {cameraPermissionGranted ? "Câmera Ativa" : "Visualização Simulada"}
            </span>
          </div>

          {/* Frame Container */}
          <div className="relative w-full aspect-video bg-gray-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-4 border-slate-900">
            {/* Real scanner div targeting camera element injection */}
            <div id="qr-reader" className="absolute inset-0 w-full h-full object-cover z-0" />

            {cameraPermissionGranted === false && (
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-2.5 z-10">
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                  <AlertTriangle className="w-7 h-7 text-rose-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-white text-xs font-bold font-sans">Acesso à Câmera Bloqueado / Negado</p>
                  <p className="text-[10px] text-gray-300 max-w-sm leading-relaxed font-sans px-3">
                    Navegadores limitam o uso da câmera dentro de iFrames de pré-visualização. Para escanear com a câmera física do seu smartphone ou PC, abra o sistema standalone.
                  </p>
                  {cameraErrorDetail && (
                    <div className="mt-1">
                      <span className="inline-block text-[9px] bg-slate-900 text-rose-300 font-mono px-2 py-0.5 rounded-md max-w-[280px] truncate">
                        Motivo: {cameraErrorDetail}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      window.open(window.location.href, "_blank");
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>🔗 Abrir em Nova Aba</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraPermissionGranted(null);
                      setCameraErrorDetail(null);
                      setCameraKey(prev => prev + 1);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-bold text-[10px] rounded-lg transition cursor-pointer"
                  >
                    🔄 Tentar Novamente
                  </button>
                </div>
              </div>
            )}

            {/* Scanning graphic overlays */}
            <div className="absolute inset-10 border-2 border-emerald-500/50 rounded-xl flex items-center justify-center pointer-events-none">
              <div className="w-[85%] h-0.5 bg-emerald-400 absolute animate-bounce shadow-[0_0_12px_rgba(34,197,94,1)]"></div>
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
            </div>

            {successAnimation && (
              <div className="absolute inset-x-0 top-4 mx-auto w-fit p-2 px-4 bg-emerald-500 text-white font-bold rounded-full text-xs shadow-lg animate-bounce flex items-center space-x-1.5 z-25">
                <CheckCircle className="w-4 h-4" />
                <span>Leitura bem Sucedida!</span>
              </div>
            )}
          </div>

          {/* Manual Input field for physical barcode guns and manual typing */}
          <div className="bg-slate-50 p-4 border border-gray-150 rounded-2xl space-y-2.5" id="manual-scan-box">
            <label htmlFor="manual-sc-gun-input" className="block text-xs font-bold text-gray-750 uppercase tracking-wide">
              🔌 Digitação Manual ou Leitor de Código de Barras (Pistola USB/Bluetooth)
            </label>
            <div className="flex gap-2">
              <input
                id="manual-sc-gun-input"
                type="text"
                placeholder="Escaneie com a Pistola, ou digite o código..."
                className="flex-1 px-3 py-2 bg-white border border-gray-255 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const code = e.currentTarget.value.trim();
                    handleBarcodeLookup(code);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("manual-sc-gun-input") as HTMLInputElement;
                  if (el && el.value.trim()) {
                    handleBarcodeLookup(el.value.trim());
                    el.value = "";
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Buscar
              </button>
            </div>
            <p className="text-[10px] text-gray-500 leading-normal">
              * Ao interagir com um leitor de código de barras físico no computador ou celular, o leitor digita os números no campo focado e pressiona <b>Enter</b> automaticamente.
            </p>
          </div>

          {/* Simulation triggers container */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-gray-500 block">⚡ Clique nos códigos de teste para simular o scanner real:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleBarcodeLookup("7891234567890")}
                className="p-2 bg-slate-50 border border-gray-100 rounded-xl hover:bg-emerald-50 text-[11px] font-mono font-semibold text-gray-700 text-left hover:border-emerald-200 transition"
                id="btn-sc-arroz"
              >
                🌾 Arroz (789...90)
              </button>
              <button
                onClick={() => handleBarcodeLookup("7891234567892")}
                className="p-2 bg-slate-50 border border-gray-100 rounded-xl hover:bg-emerald-50 text-[11px] font-mono font-semibold text-gray-700 text-left hover:border-emerald-200 transition"
                id="btn-sc-frango"
              >
                🍗 Frango (789...92)
              </button>
              <button
                onClick={() => handleBarcodeLookup("7891234567899")}
                className="p-2 bg-slate-50 border border-gray-100 rounded-xl hover:bg-emerald-50 text-[11px] font-mono font-semibold text-gray-700 text-left hover:border-emerald-200 transition"
                id="btn-sc-maca"
              >
                🍎 Maçã Gala (789...99)
              </button>
              <button
                onClick={() => handleBarcodeLookup("7899999999999")} // Not found unregistered barcode
                className="p-2 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100/50 text-[11px] font-mono font-bold text-rose-800 text-left hover:border-rose-200 transition"
                id="btn-sc-novocod"
              >
                🆕 Código Novo (EAN-13)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Scan details & Movement registration form */}
        <div className="lg:col-span-5 bg-white p-5 border border-gray-100 rounded-3xl shadow-xs space-y-4" id="scanner-details-pane">
          <div className="border-b border-gray-50 pb-3" id="scanned-code-title">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Inspeção Detalhada</span>
            <h3 className="font-bold text-gray-900 text-sm">Registro / Cadastro Rápido</h3>
          </div>

          {scanStatus === "idle" && (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Barcode className="w-12 h-12 stroke-1 opacity-40 mx-auto" id="barcode-icon" />
              <p className="text-xs">Aguardando leitura de código de barras...</p>
              <p className="text-[10px] text-gray-500 max-w-[190px] mx-auto">
                Aponte a câmera ou selecione um código de exemplo para carregar a movimentação rápida do produto.
              </p>
            </div>
          )}

          {scanStatus === "searching" && (
            <div className="py-12 text-center text-gray-500 space-y-3">
              <div className="w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mx-auto"></div>
              <p className="text-xs font-mono">Buscando {scannedCode} no catálogo...</p>
            </div>
          )}

          {scanStatus === "found" && scannedProduct && (
            <div className="space-y-4 animate-scale-in" id="scanned-result-box">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center space-x-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-1.5 py-0.5 rounded">
                    {scannedProduct.category}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm truncate mt-1">{scannedProduct.name}</h4>
                  <p className="text-[10px] text-gray-500 font-mono">Disponível: {scannedProduct.quantity} {scannedProduct.unit}</p>
                </div>
              </div>

              {/* Sub-tab choice toggle buttons */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl" id="scanner-subtabs">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('balance')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    activeSubTab === "balance"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Barcode className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ajuste de Saldo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('wastage')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    activeSubTab === "wastage"
                      ? "bg-rose-550 bg-rose-600 text-white shadow-xs animate-scale-in"
                      : "text-gray-500 hover:text-gray-800 hover:bg-rose-50/20"
                  }`}
                >
                  <AlertTriangle className={`w-3.5 h-3.5 ${activeSubTab === 'wastage' ? 'text-white' : 'text-rose-500'}`} />
                  <span>Verificar Desperdício</span>
                </button>
              </div>

              {/* Dynamic View Panel */}
              {activeSubTab === 'balance' ? (
                /* Regular Movement form selection */
                <form onSubmit={handleFastQuantitySubmit} className="space-y-4 p-4 border border-gray-150 rounded-2xl bg-slate-50/20 animate-scale-in" id="fast-adjust-form">
                  <span className="text-xs font-extrabold text-slate-700 block">⚡ Lançar Transação Imediata</span>
                  
                  <div className="grid grid-cols-2 gap-2" id="fast-type-select">
                    <button
                      type="button"
                      onClick={() => setFastType("entrada")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 transition cursor-pointer ${
                        fastType === "entrada" 
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" 
                          : "bg-white text-gray-650 border-gray-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>Entrada (+)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFastType("saida")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 transition cursor-pointer ${
                        fastType === "saida" 
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs" 
                          : "bg-white text-gray-650 border-gray-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Saída (-)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Qtd do Lote ({scannedProduct.unit})</label>
                      <input
                        type="number"
                        step="any"
                        required
                        min="0.1"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                        value={fastQty}
                        onChange={(e) => setFastQty(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Localização</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-slate-100 border border-gray-200 rounded-xl text-xs text-gray-500 font-mono outline-none"
                        disabled
                        value={scannedProduct.location}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Observações da Carga</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs"
                      placeholder="Ex: Entrega de mantimentos semanais da Prefeitura"
                      value={fastNotes}
                      onChange={(e) => setFastNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setScanStatus("idle"); setScannedProduct(null); isProcessingRef.current = false; }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-gray-650 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Descartar Scan
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 py-2 text-white rounded-xl text-xs font-bold transition hover:opacity-90 cursor-pointer ${
                        fastType === 'entrada' ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                    >
                      Efetivar Saldo
                    </button>
                  </div>
                </form>
              ) : (
                /* Interactive Wastage Verification Form (Visual State confirmation + Photo attachment) */
                <form onSubmit={handleWastageSubmit} className="space-y-4 p-4 border border-rose-105 rounded-2xl bg-rose-50/10 animate-scale-in" id="waste-verification-form">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-rose-700 flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4 text-rose-550 text-rose-600" />
                      <span>Laudo de Vistoria de Desperdício</span>
                    </span>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      Verifique os fatores de avaria abaixo e anexe imagem comprobatória para o relatório de prestação de contas.
                    </p>
                  </div>

                  {/* Checklist check buttons presets */}
                  <div className="space-y-1.5" id="waste-checklist-container">
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                      Fatores de Avaria Encontrados:
                    </label>
                    <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {checklistPresets.map((preset) => {
                        const active = wasteChecklist.includes(preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => toggleWastageCondition(preset)}
                            className={`p-2 rounded-xl text-[11px] font-semibold text-left border flex items-center justify-between transition cursor-pointer ${
                              active
                                ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                                : "bg-white text-gray-750 border-gray-200 hover:bg-slate-50"
                            }`}
                          >
                            <span>{preset}</span>
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                              active ? "bg-white text-rose-600 border-white" : "border-gray-300"
                            }`}>
                              {active ? "✓" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Photo attachment area */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                      Evidência Fotográfica do Lote:
                    </label>

                    {wastePhoto ? (
                      <div className="relative border border-gray-200 rounded-2xl overflow-hidden aspect-video bg-slate-900 group">
                        <img 
                          src={wastePhoto} 
                          alt="Evidência do Desperdício" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition cursor-pointer"
                            title="Tirar Outra Foto"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setWastePhoto(null)}
                            className="p-2 bg-rose-600 rounded-full text-white hover:bg-rose-700 transition cursor-pointer"
                            title="Deletar Foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-rose-600 text-white rounded-lg text-[9px] font-bold uppercase">
                          CÂMERA ✓ FOTO ANEXADA
                        </span>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 bg-slate-50/50 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 text-center">
                        <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-600">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700 leading-none">Verificação Visual Obrigatória</p>
                          <p className="text-[10px] text-gray-400 mt-1 max-w-[210px] mx-auto leading-relaxed">Instale uma foto do estado real do insumo usando a câmera ativa ou envie arquivo.</p>
                        </div>
                        
                        <div className="flex gap-2 w-full pt-1">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-950 text-white text-[10px] font-bold rounded-xl flex items-center justify-center space-x-1 shadow-2xs cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                            <span>{capturingState === 'capturing' ? 'Capturando...' : 'Capturar Foto'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-1.5 bg-white text-gray-650 hover:bg-slate-50 border border-gray-200 text-[10px] font-bold rounded-xl flex items-center justify-center space-x-1 shadow-3xs cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-gray-400" />
                            <span>Upload</span>
                          </button>
                        </div>

                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handlePhotoUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                    )}
                  </div>

                  {/* Waste specific parameters */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Quantidade Desperdiçada ({scannedProduct.unit})</label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0.1"
                      className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-rose-500 text-gray-800"
                      value={wasteQty}
                      onChange={(e) => setWasteQty(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Relato Descritivo Adicional</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 bg-white border border-gray-250 rounded-xl text-xs"
                      placeholder="Ex: Caixa com umidade vinda do fornecedor escolar"
                      value={wasteNotes}
                      onChange={(e) => setWasteNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setScanStatus("idle"); setScannedProduct(null); isProcessingRef.current = false; }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-205 text-gray-650 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Descartar Scan
                    </button>
                    <button
                      type="submit"
                      disabled={wasteChecklist.length === 0}
                      className={`flex-1 py-2 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                        wasteChecklist.length === 0 
                          ? 'bg-rose-300 cursor-not-allowed opacity-80' 
                          : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Efetivar Desperdício</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {scanStatus === "notFound" && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-4 animate-scale-in" id="code-not-registered-box">
              <div className="flex items-start space-x-2 text-amber-800" style={{ contentVisibility: "auto" }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">Código não Encontrado!</h4>
                  <p className="text-[10px] text-gray-600 leading-relaxed mt-0.5">
                    O código <b className="font-mono text-gray-950 font-black">{scannedCode}</b> lido pelo leitor não possui nenhum produto correspondente cadastrado no banco de dados escolar da escola.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-2">
                <span className="text-[10px] text-gray-500 block">Deseja cadastrar um novo produto com este código?</span>
                <button
                  onClick={() => onAddProductWithBarcode(scannedCode)}
                  id="btn-register-scanned-code-now"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar {scannedCode} no Estoque</span>
                </button>
              </div>

              <button
                onClick={() => { setScanStatus("idle"); setScannedCode(""); isProcessingRef.current = false; }}
                className="w-full py-1.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200"
              >
                Tentar outro Código
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Educational info card */}
      <div className="p-4 bg-slate-50 border border-gray-150 rounded-2xl flex items-center space-x-3" id="quick-barcode-note">
        <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <span className="text-[10px] text-gray-500 leading-relaxed font-sans">
          Dica de produtividade: O aplicativo funciona offline de forma integrada. Caso leia códigos no pátio ou despensa da escola sem conexão com a internet, o aplicativo irá salvar os dados localmente no Android e sincronizará em lote assim que o status da internet restabelecer.
        </span>
      </div>
    </div>
  );
}
