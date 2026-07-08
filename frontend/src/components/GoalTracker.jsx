import React from 'react';
import { RevenueIcon } from './Icons';

const GoalTracker = ({ actualRevenue = 0, targetGoal = 1, onTargetChange }) => {
  const safeRevenue = actualRevenue || 0;
  const safeGoal = targetGoal || 1;
  const percentage = Math.min(100, Math.round((safeRevenue / safeGoal) * 100)) || 0;
  
  // SVG circular properties
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="card-3d goal-tracker-card">
      <div className="card-3d-inner">
        <div className="goal-header">
          <div className="goal-title-area">
            <div className="icon-wrapper bg-green">
              <RevenueIcon className="w-5 h-5 text-green" />
            </div>
            <div>
              <h3>Sales Goal Target</h3>
              <p className="subtitle">Converted Revenue vs Goal</p>
            </div>
          </div>
          <div className="goal-percentage-badge">
            {percentage}% Achieved
          </div>
        </div>

        <div className="goal-body">
          {/* Circular Progress Gauge */}
          <div className="gauge-container">
            <svg className="gauge-svg" width="160" height="160" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                className="gauge-bg"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                className="gauge-progress"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="gauge-text">
              <span className="gauge-number">${safeRevenue.toLocaleString()}</span>
              <span className="gauge-sub">Current Sales</span>
            </div>
          </div>

          {/* Target input slider */}
          <div className="target-input-area">
            <div className="target-labels">
              <span>Adjust Goal:</span>
              <span className="target-val">${targetGoal.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="500000"
              step="5000"
              value={targetGoal}
              onChange={(e) => onTargetChange(parseInt(e.target.value))}
              className="target-slider"
            />
            <div className="target-bounds">
              <span>$10k</span>
              <span>$500k</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalTracker;
