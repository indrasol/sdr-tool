import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onResend?: () => void;
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  timerDuration?: number; // in seconds
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  onResend,
  isLoading = false,
  className,
  disabled = false,
  autoFocus = true,
  timerDuration = 300, // 5 minutes default
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const [timer, setTimer] = useState(timerDuration);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, value: string) => {
    if (disabled || isLoading) return;

    // Only allow digits
    const digitValue = value.replace(/\D/g, "");
    if (digitValue.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = digitValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (digitValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if OTP is complete
    if (newOtp.every((digit) => digit !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (disabled || isLoading) return;

    if (e.key === "Backspace") {
      if (otp[index]) {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // Focus previous input and clear it
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled || isLoading) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    
    if (pastedData.length === length) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      onComplete(pastedData);
      inputRefs.current[length - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (canResend && onResend && !isLoading) {
      setTimer(timerDuration);
      setCanResend(false);
      setOtp(Array(length).fill(""));
      onResend();
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* OTP Input Fields */}
      <div className="flex justify-center space-x-3">
        {otp.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled || isLoading}
            className={cn(
              "w-12 h-12 text-center text-xl font-semibold border-2 rounded-xl",
              "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
              "transition-all duration-300",
              digit ? "border-green-500 bg-green-50" : "border-gray-200",
              (disabled || isLoading) && "opacity-50 cursor-not-allowed"
            )}
          />
        ))}
      </div>

      {/* Timer and Resend */}
      <div className="text-center space-y-2">
        {timer > 0 ? (
          <p className="text-sm text-gray-600">
            OTP expires in{" "}
            <span className="font-medium text-purple-600">
              {formatTime(timer)}
            </span>
          </p>
        ) : (
          <p className="text-sm text-red-600">OTP has expired</p>
        )}

        {onResend && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={!canResend || isLoading}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
          >
            {isLoading ? "Sending..." : "Resend OTP"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default OTPInput;
