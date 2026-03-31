"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Fingerprint,
  Eye,
  KeyRound,
  Smartphone,
  Shield,
  Check,
  Lock,
} from "lucide-react";

interface AuthMethod {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  recommended?: boolean;
  available: boolean;
}

const authMethods: AuthMethod[] = [
  {
    id: "biometric",
    label: "Biometric",
    description: "Use Face ID or fingerprint to authenticate QR payments",
    icon: <Fingerprint size={22} />,
    iconBg: "#F0FDF4",
    iconColor: "#1B4332",
    recommended: true,
    available: true,
  },
  {
    id: "pin",
    label: "PIN Code",
    description: "Use a 6-digit PIN to authenticate QR payments",
    icon: <KeyRound size={22} />,
    iconBg: "#EFF6FF",
    iconColor: "#2980B9",
    available: true,
  },
  {
    id: "password",
    label: "Password",
    description: "Use your account password to authenticate QR payments",
    icon: <Lock size={22} />,
    iconBg: "#FFF7ED",
    iconColor: "#E67E22",
    available: true,
  },
  {
    id: "otp",
    label: "One-Time Password (OTP)",
    description: "Receive an OTP via SMS or email for each QR payment",
    icon: <Smartphone size={22} />,
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
    available: true,
  },
  {
    id: "faceId",
    label: "Face ID Only",
    description: "Use facial recognition exclusively for QR payments",
    icon: <Eye size={22} />,
    iconBg: "#FFF1F2",
    iconColor: "#C0392B",
    available: false,
  },
];

const securityLevels: Record<string, { label: string; color: string; bg: string }> = {
  biometric: { label: "Very High", color: "#27AE60", bg: "#F0FDF4" },
  pin: { label: "Medium", color: "#E67E22", bg: "#FFF7ED" },
  password: { label: "High", color: "#2980B9", bg: "#EFF6FF" },
  otp: { label: "Very High", color: "#27AE60", bg: "#F0FDF4" },
  faceId: { label: "Very High", color: "#27AE60", bg: "#F0FDF4" },
};

export default function QRAuthPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState("biometric");
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [pinError, setPinError] = useState("");
  const [saved, setSaved] = useState(false);
  const [requireAuth, setRequireAuth] = useState(true);

  useEffect(() => {
    const savedMethod = localStorage.getItem("onebank_qr_auth_method");
    const savedRequireAuth = localStorage.getItem("onebank_qr_require_auth");
    if (savedMethod) setSelectedMethod(savedMethod);
    if (savedRequireAuth) setRequireAuth(savedRequireAuth === "true");
  }, []);

  function handleSelectMethod(id: string) {
    if (!authMethods.find((m) => m.id === id)?.available) return;
    setSelectedMethod(id);
    if (id === "pin") {
      setShowPinSetup(true);
      setPinStep("enter");
      setPin(["", "", "", "", "", ""]);
      setConfirmPin(["", "", "", "", "", ""]);
      setPinError("");
    } else {
      setShowPinSetup(false);
    }
  }

  function handlePinInput(index: number, value: string, isConfirm: boolean) {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    if (isConfirm) {
      const newPin = [...confirmPin];
      newPin[index] = value;
      setConfirmPin(newPin);
      if (value && index < 5) {
        document.getElementById(`confirm-pin-${index + 1}`)?.focus();
      }
    } else {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      if (value && index < 5) {
        document.getElementById(`pin-${index + 1}`)?.focus();
      }
    }
  }

  function handlePinNext() {
    if (pin.some((p) => p === "")) {
      setPinError("Please enter all 6 digits.");
      return;
    }
    setPinError("");
    setPinStep("confirm");
  }

  function handlePinConfirm() {
    if (confirmPin.some((p) => p === "")) {
      setPinError("Please confirm all 6 digits.");
      return;
    }
    if (pin.join("") !== confirmPin.join("")) {
      setPinError("PINs do not match. Please try again.");
      setConfirmPin(["", "", "", "", "", ""]);
      document.getElementById("confirm-pin-0")?.focus();
      return;
    }
    setPinError("");
    setShowPinSetup(false);
  }

  function handleSave() {
    localStorage.setItem("onebank_qr_auth_method", selectedMethod);
    localStorage.setItem("onebank_qr_require_auth", String(requireAuth));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.back();
    }, 1500);
  }

  const security = securityLevels[selectedMethod];

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#718096] hover:text-[#1B4332] transition-colors font-medium"
      >
        <ArrowLeft size={16} />
        Back to Settings
      </button>

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[#1A202C]">
          QR Pay Authentication
        </h2>
        <p className="text-xs text-[#718096] mt-0.5">
          Choose how to verify your identity for QR payments
        </p>
      </div>

      {/* Security Level */}
      <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
              <Shield size={16} className="text-[#1B4332]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1A202C]">
                Current Security Level
              </p>
              <p className="text-[10px] text-[#718096]">
                Based on selected authentication method
              </p>
            </div>
          </div>
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: security.bg, color: security.color }}
          >
            {security.label}
          </span>
        </div>
      </Card>

      {/* Require Auth Toggle */}
      <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1A202C]">
              Require Authentication
            </p>
            <p className="text-xs text-[#718096] mt-0.5">
              Always verify identity before processing QR payments
            </p>
          </div>
          <button
            onClick={() => setRequireAuth(!requireAuth)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              requireAuth ? "bg-[#1B4332]" : "bg-[#CBD5E0]"
            }`}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-transform"
              style={{
                backgroundColor: requireAuth ? "#D4A017" : "#FFFFFF",
                transform: requireAuth ? "translateX(20px)" : "translateX(2px)",
              }}
            />
          </button>
        </div>
      </Card>

      {/* Auth Methods */}
      <div>
        <p className="text-xs font-bold text-[#718096] uppercase tracking-widest mb-3">
          Authentication Method
        </p>
        <div className="space-y-3">
          {authMethods.map((method) => (
            <Card
              key={method.id}
              onClick={() => handleSelectMethod(method.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                method.available
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              } ${
                selectedMethod === method.id
                  ? "border-[#1B4332] bg-[#F0FDF4]"
                  : "border-[#E2E8F0] bg-white hover:border-[#1B4332]"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: method.iconBg,
                    color: method.iconColor,
                  }}
                >
                  {method.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#1A202C]">
                      {method.label}
                    </p>
                    {method.recommended && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#D4A017] text-white">
                        Recommended
                      </span>
                    )}
                    {!method.available && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F4F6F8] text-[#A0AEC0]">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#718096] mt-0.5">
                    {method.description}
                  </p>
                </div>

                {/* Selected */}
                {selectedMethod === method.id && (
                  <div className="w-6 h-6 rounded-full bg-[#1B4332] flex items-center justify-center shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                <KeyRound size={24} className="text-[#2980B9]" />
              </div>
              <h3 className="text-base font-bold text-[#1A202C]">
                {pinStep === "enter" ? "Set Your PIN" : "Confirm Your PIN"}
              </h3>
              <p className="text-xs text-[#718096] mt-1">
                {pinStep === "enter"
                  ? "Enter a 6-digit PIN for QR payments"
                  : "Re-enter your PIN to confirm"}
              </p>

              {/* PIN Input */}
              <div className="flex gap-3 justify-center mt-6">
                {(pinStep === "enter" ? pin : confirmPin).map((digit, i) => (
                  <input
                    key={i}
                    id={pinStep === "enter" ? `pin-${i}` : `confirm-pin-${i}`}
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handlePinInput(i, e.target.value, pinStep === "confirm")
                    }
                    className="w-10 h-12 text-center text-lg font-bold border-2 border-[#E2E8F0] rounded-xl focus:border-[#1B4332] focus:outline-none bg-[#F4F6F8]"
                  />
                ))}
              </div>

              {pinError && (
                <p className="text-xs text-[#C0392B] mt-3 font-semibold">
                  {pinError}
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPinSetup(false);
                    setSelectedMethod("biometric");
                  }}
                  className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096]"
                >
                  Cancel
                </button>
                <button
                  onClick={pinStep === "enter" ? handlePinNext : handlePinConfirm}
                  className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold"
                >
                  {pinStep === "enter" ? "Next" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full h-12 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          saved ? "bg-[#27AE60]" : "bg-[#1B4332] hover:bg-[#2D6A4F]"
        }`}
      >
        {saved ? (
          <>
            <Check size={16} />
            Saved Successfully!
          </>
        ) : (
          "Save Authentication Settings"
        )}
      </button>
    </div>
  );
}
