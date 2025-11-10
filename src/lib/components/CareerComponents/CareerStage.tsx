import CandidateCard from "./CandidateCard";

// Helper function to group timeline stages and their substages
const groupTimelineStages = (timelineStages: any) => {
  const grouped: { [key: string]: { stages: string[], candidates: any[], droppedCount: number } } = {
    "CV Screening": { stages: ["CV Review"], candidates: [], droppedCount: 0 },
    "AI Interview": { stages: ["Pending AI Interview", "AI Interview Review"], candidates: [], droppedCount: 0 },
    "Human Interview": { stages: ["For Human Interview", "Human Interview Review"], candidates: [], droppedCount: 0 },
    "Coding Test": { stages: ["Pending Job Interview"], candidates: [], droppedCount: 0 },
    "Job Offer": { stages: ["Job Offered", "Contract Signed"], candidates: [], droppedCount: 0 },
  };

  Object.keys(grouped).forEach((timeline) => {
    grouped[timeline].stages.forEach((stageName) => {
      if (timelineStages[stageName]) {
        grouped[timeline].candidates.push(...(timelineStages[stageName].candidates || []));
        grouped[timeline].droppedCount += timelineStages[stageName].droppedCandidates?.length || 0;
      }
    });
  });

  return grouped;
};

// Define predefined substages for each timeline
const getTimelineSubstages = (timelineName: string): string[] => {
  const substageMap: { [key: string]: string[] } = {
    "CV Screening": ["Waiting Submission", "For Review"],
    "AI Interview": ["Waiting Interview", "For Review"],
    "Human Interview": ["Waiting Schedule", "Waiting Interview", "For Review"],
    "Coding Test": ["Coding Test"],
    "Job Offer": ["For Final Review", "Waiting Offer Acceptance", "For Contract Signing", "Hired"],
  };
  return substageMap[timelineName] || [];
};

// Helper function to group candidates by substage within a timeline
const groupCandidatesBySubstage = (candidates: any[], timelineName: string) => {
  // Initialize with predefined substages
  const predefinedSubstages = getTimelineSubstages(timelineName);
  const substages: { [key: string]: any[] } = {};
  
  // Initialize all predefined substages with empty arrays
  predefinedSubstages.forEach(substage => {
    substages[substage] = [];
  });
  
  candidates.forEach((candidate) => {
    let substage = "For Review";
    
    // Determine substage based on timeline and candidate status
    if (timelineName === "CV Screening") {
      if (candidate.currentStep === "CV Screening" && candidate.cvStatus === "Pending") {
        substage = "Waiting Submission";
      } else {
        substage = "For Review";
      }
    } else if (timelineName === "AI Interview") {
      // Check if candidate is waiting for interview or already completed it
      if (candidate.status === "For Interview" || candidate.status === "For AI Interview") {
        substage = "Waiting Interview";
      } else {
        substage = "For Review";
      }
    } else if (timelineName === "Human Interview") {
      if (candidate.status === "For Human Interview") {
        substage = "Waiting Interview";
      } else if (candidate.status === "For Human Interview Review") {
        substage = "For Review";
      } else {
        substage = "Waiting Schedule";
      }
    } else if (timelineName === "Coding Test") {
      substage = "Coding Test";
    } else if (timelineName === "Job Offer") {
      if (candidate.currentStep === "Job Offered") {
        substage = "For Final Review";
      } else if (candidate.currentStep === "Contract Signed") {
        substage = "For Contract Signing";
      } else if (candidate.currentStep === "Hired") {
        substage = "Hired";
      } else {
        substage = "Waiting Offer Acceptance";
      }
    }
    
    if (!substages[substage]) {
      substages[substage] = [];
    }
    substages[substage].push(candidate);
  });
  
  return substages;
};

export default function CareerStageColumn({ timelineStages, handleCandidateMenuOpen, handleCandidateCVOpen, handleDroppedCandidatesOpen, handleEndorseCandidate, handleDropCandidate, dragEndorsedCandidate, handleCandidateHistoryOpen, handleRetakeInterview }: any) {
  const groupedTimelines = groupTimelineStages(timelineStages);
  
  const handleDroppedClick = (timelineName: string) => {
    // Open dropped candidates for the first stage in the timeline
    const firstStage = groupedTimelines[timelineName].stages[0];
    handleDroppedCandidatesOpen(firstStage);
  };

  return (
    <div className="career-timeline-wrapper">
      <div className="career-stage-container-v2">
        {Object.keys(groupedTimelines).map((timelineName, idx) => {
          const timeline = groupedTimelines[timelineName];
          const totalCandidates = timeline.candidates.length;
          const droppedCount = timeline.droppedCount;
          const substages = groupCandidatesBySubstage(timeline.candidates, timelineName);
          
          return (
            <div className="timeline-card" key={idx}>
              {/* Timeline Header */}
              <div className="timeline-header">
                <div className="timeline-title-section">
                  <span className="timeline-title">{timelineName}</span>
                  <span className="timeline-count">{totalCandidates}</span>
                </div>
                <button 
                  className="dropped-candidates-btn-v2" 
                  onClick={() => handleDroppedClick(timelineName)}
                >
                  <i className="la la-user-times"></i>
                  <span>{droppedCount} Dropped Candidates</span>
                </button>
              </div>

              {/* Substages Container */}
              <div className="substages-wrapper">
                {Object.keys(substages).map((substage, subIdx) => (
                  <div 
                    key={subIdx}
                    className="substage-column"
                    onDragOver={(e) => {
                      e.preventDefault();
                      const target = e.currentTarget;
                      target.style.background = "#F0F0F5";
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.background = "";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = "";

                      const candidateId = e.dataTransfer.getData("candidateId");
                      const originStageKey = e.dataTransfer.getData("stageKey");
                      // Use the first stage in the timeline for drop target
                      const targetStage = timeline.stages[0];
                      if (candidateId && originStageKey && originStageKey !== targetStage) {
                        dragEndorsedCandidate(candidateId, originStageKey, targetStage);
                      }
                    }}
                  >
                    {/* Substage Header */}
                    <div className="substage-header">
                      <i className="la la-bolt" style={{ color: "#10B981", fontSize: 16 }}></i>
                      <span className="substage-title">{substage}</span>
                      <span className="substage-count">{substages[substage].length}</span>
                    </div>

                    {/* Candidate Cards or Empty State */}
                    <div className="substage-cards">
                      {substages[substage].length > 0 ? (
                        substages[substage].map((candidate: any, cardIdx: number) => (
                          <CandidateCard 
                            key={cardIdx} 
                            candidate={candidate} 
                            stage={timeline.stages.find((s: string) => 
                              timelineStages[s]?.candidates?.some((c: any) => c._id === candidate._id)
                            ) || timeline.stages[0]}
                            handleCandidateMenuOpen={handleCandidateMenuOpen} 
                            handleCandidateCVOpen={handleCandidateCVOpen} 
                            handleEndorseCandidate={handleEndorseCandidate} 
                            handleDropCandidate={handleDropCandidate} 
                            handleCandidateHistoryOpen={handleCandidateHistoryOpen}
                            handleRetakeInterview={handleRetakeInterview}
                          />
                        ))
                      ) : (
                        <div className="empty-substage">
                          <span>Currently no candidates in this stage</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}