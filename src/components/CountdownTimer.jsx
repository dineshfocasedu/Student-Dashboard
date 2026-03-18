import React from 'react';

const CountdownTimer = ({ timeLeft }) => {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-2xl font-mono bg-red-600 px-4 py-2 rounded">
      {formatTime(timeLeft)}
    </div>
  );
};

export default CountdownTimer;