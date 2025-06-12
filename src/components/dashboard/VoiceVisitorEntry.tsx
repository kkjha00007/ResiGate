// src/components/dashboard/VoiceVisitorEntry.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, XCircle, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';

const steps = [
  { key: 'visitorName', prompt: "Say visitor's name" },
  { key: 'flatNumber', prompt: "Say flat number" },
  { key: 'purposeOfVisit', prompt: "Say purpose of visit" },
  { key: 'mobileNumber', prompt: "Say mobile number (or say 'skip')" },
];

interface EntryConfirmationDetails {
  visitorName: string;
  flatNumber: string;
  tokenCode: string;
  entryTimestamp: string;
  id: string;
  status: 'pending' | 'approved' | 'denied';
}

export default function VoiceVisitorEntry() {
  const [step, setStep] = useState(0);
  const [listening, setListening] = useState(false);
  const [results, setResults] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [entryDetails, setEntryDetails] = useState<EntryConfirmationDetails | null>(null);
  const recognitionRef = useRef<any>(null);

  // Web Speech API integration
  const handleStart = () => {
    setError(null);
    setListening(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setResults(prev => ({ ...prev, [steps[step].key]: transcript }));
      setListening(false);
    };
    recognition.onerror = (event: any) => {
      setError('Could not recognize speech. Please try again.');
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleNext = () => {
    setStep(s => Math.min(s + 1, steps.length - 1));
    setListening(false);
    setError(null);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };
  const handleRestart = () => {
    setStep(0);
    setResults({});
    setListening(false);
    setError(null);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const isLastStep = step === steps.length - 1;

  const handleSubmit = async () => {
    setListening(false);
    setError(null);
    // Compose data for API
    try {
      // Get societyId from URL query param (if present)
      let societyId: string | null = null;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        societyId = urlParams.get('societyId');
      }
      if (!societyId) {
        setError('Society ID is missing. Please scan the correct QR code or contact admin.');
        return;
      }
      let mobileNumber = results.mobileNumber || '';
      if (mobileNumber.toLowerCase() === 'skip') mobileNumber = '';
      const submissionData = {
        visitorName: results.visitorName,
        flatNumber: results.flatNumber,
        purposeOfVisit: results.purposeOfVisit,
        mobileNumber,
        societyId,
      };
      const response = await fetch('/api/public-visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit visitor entry');
      }
      const createdEntry = await response.json();
      setEntryDetails({
        visitorName: createdEntry.visitorName,
        flatNumber: createdEntry.flatNumber,
        tokenCode: createdEntry.tokenCode,
        entryTimestamp: createdEntry.entryTimestamp,
        id: createdEntry.id,
        status: 'approved', // Always approved for now
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit entry');
    }
  };

  if (entryDetails) {
    return (
      <Card className="mb-6 shadow-xl max-w-lg mx-auto text-center">
        <CardHeader>
          <CheckCircle className="h-16 w-16 text-accent mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold text-primary">Entry Submitted Successfully!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Thank you, {entryDetails.visitorName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border border-amber-400 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="text-base font-bold text-amber-700 uppercase tracking-wide">IMPORTANT: Show to Security</h3>
                <p className="mt-1 text-sm font-semibold text-amber-700">
                  Please show this information to the security guard for verification.
                </p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Flat Number:</p>
            <p className="text-lg font-extrabold text-accent">{entryDetails.flatNumber}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Entry Time:</p>
            <p className="text-lg text-foreground font-semibold">
              {format(new Date(entryDetails.entryTimestamp), 'dd - LLLL - yyyy hh:mm:ss a')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Token Code:</p>
            <p className="text-2xl font-bold text-accent">{entryDetails.tokenCode}</p>
          </div>
          <Button onClick={handleRestart} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <RefreshCw className="mr-2 h-4 w-4" /> Make Another Entry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 shadow-xl max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">Voice-Assisted Visitor Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="text-lg font-medium mb-2">{steps[step].prompt}</div>
          <Button size="lg" onClick={handleStart} disabled={listening} className="rounded-full p-6">
            {listening ? <MicOff className="h-8 w-8 animate-pulse" /> : <Mic className="h-8 w-8" />}
            <span className="ml-2">{listening ? 'Listening...' : 'Start Voice Entry'}</span>
          </Button>
          {/* Show recognized text for current step */}
          {results[steps[step].key] && (
            <div className="text-green-700 font-semibold">Heard: {results[steps[step].key]}</div>
          )}
          {error && <div className="text-red-600 font-semibold">{error}</div>}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleRestart}>Restart</Button>
            {isLastStep ? (
              <Button onClick={handleSubmit} disabled={!results[steps[step].key]}>
                Submit
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!results[steps[step].key]}>Next</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
