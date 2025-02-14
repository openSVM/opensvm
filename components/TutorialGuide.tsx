'use client';

import { useState, useEffect } from 'react';
import { Button, Text } from 'rinlab';

interface TutorialStep {
  title: string;
  description: string;
  targetId: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Transaction Flow',
    description: 'This visual diagram shows the flow of instructions in your transaction.',
    targetId: 'transaction-visualizer'
  },
  {
    title: 'Transaction Details',
    description: 'View key information like signature, status, and timestamps.',
    targetId: 'transaction-details'
  },
  {
    title: 'Instructions',
    description: 'Examine the individual instructions that make up this transaction.',
    targetId: 'instructions'
  },
  {
    title: 'Transaction Logs',
    description: 'Switch between summary and detailed logs using the tabs below.',
    targetId: 'transaction-logs'
  }
];

export function TutorialGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenTransactionTutorial');
    if (!seen) {
      setIsVisible(true);
      setHasSeenTutorial(false);
    } else {
      setHasSeenTutorial(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      const element = document.getElementById(tutorialSteps[currentStep + 1].targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenTransactionTutorial', 'true');
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsVisible(true);
    const element = document.getElementById(tutorialSteps[0].targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 text-xs"
        onClick={handleRestart}
      >
        Show Tutorial
      </Button>
    );
  }

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-background border border-border rounded-lg shadow-lg p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Text variant="label" className="text-sm font-medium">
            {currentTutorialStep.title}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={handleClose}
          >
            ✕
          </Button>
        </div>
        <Text variant="default" className="text-sm">
          {currentTutorialStep.description}
        </Text>
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <Button
            variant="default"
            size="sm"
            className="text-xs"
            onClick={handleNext}
          >
            {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
