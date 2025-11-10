"use client";
import { useState } from "react";
import CareerFit from "./CareerFit";
import { extractInterviewAssessment, formatDateToRelativeTime } from "../../Utils";

export default function CandidateCard({ candidate, stage, handleCandidateMenuOpen, handleCandidateCVOpen, handleEndorseCandidate, handleDropCandidate, handleCandidateHistoryOpen, handleRetakeInterview}: any) {
    const { name, email, image, createdAt, currentStep, cvStatus, jobFit, cvScreeningReason, summary } = candidate;
    const [menuOpen, setMenuOpen] = useState(false);

    const handleSelectMenuOption = () => {
        handleCandidateMenuOpen({...candidate, stage});
        setMenuOpen(!menuOpen);
    }

    const handleViewCV = () => {
        handleCandidateCVOpen({...candidate, stage});
        setMenuOpen(!menuOpen);
    }

    const handleViewHistory = () => {
        handleCandidateHistoryOpen({...candidate, stage});
        setMenuOpen(!menuOpen);
    }

    const hasPendingInterviewRetakeRequest = candidate?.retakeRequest  && !["Approved", "Rejected"].includes(candidate?.retakeRequest?.status);
    
    // Determine if candidate is in a review stage (assessed by Jia, not manually endorsed)
    const isInReviewStage = stage === "CV Review" || stage === "AI Interview Review" || stage === "Human Interview Review";
    
    // Determine fit badge details
    const getFitBadge = () => {
        if (currentStep === "CV Screening" || stage === "Pending AI Interview" || stage === "AI Interview Review") {
            const status = cvStatus || "N/A";
            let color = "#6B7280";
            let bgColor = "#F3F4F6";
            let icon = "la-star";
            
            if (status === "Strong Fit") {
                color = "#059669";
                bgColor = "#D1FAE5";
                icon = "la-star";
            } else if (status === "Good Fit") {
                color = "#2563EB";
                bgColor = "#DBEAFE";
                icon = "la-star";
            } else if (status === "Maybe Fit") {
                color = "#D97706";
                bgColor = "#FEF3C7";
                icon = "la-star-half-alt";
            } else if (status === "Bad Fit") {
                color = "#DC2626";
                bgColor = "#FEE2E2";
                icon = "la-times-circle";
            }
            
            return { label: `Jia: ${status}`, color, bgColor, icon };
        } else {
            const status = jobFit || "N/A";
            let color = "#6B7280";
            let bgColor = "#F3F4F6";
            let icon = "la-star";
            
            if (status === "Strong Fit") {
                color = "#059669";
                bgColor = "#D1FAE5";
                icon = "la-star";
            } else if (status === "Good Fit") {
                color = "#2563EB";
                bgColor = "#DBEAFE";
                icon = "la-star";
            } else if (status === "Maybe Fit") {
                color = "#D97706";
                bgColor = "#FEF3C7";
                icon = "la-star-half-alt";
            } else if (status === "Bad Fit") {
                color = "#DC2626";
                bgColor = "#FEE2E2";
                icon = "la-times-circle";
            }
            
            return { label: `Jia: ${status}`, color, bgColor, icon };
        }
    };
    
    const fitBadge = getFitBadge();
    
    return (
        <div 
        draggable={true}
        onDragStart={(e) => {
            e.dataTransfer.setData("candidateId", candidate._id);
            e.dataTransfer.setData("stageKey", stage);
        }}
        className="candidate-card-v2"
        style={{ 
            cursor: "pointer",
            background: hasPendingInterviewRetakeRequest ? "#FFFAEB" : "white"
        }} 
        onClick={(e) => {
            if (e.defaultPrevented) return;
            handleCandidateMenuOpen({...candidate, stage})
        }}>
            {/* Fit Badge */}
            <div className="candidate-fit-badge" style={{ 
                background: fitBadge.bgColor,
                color: fitBadge.color 
            }}>
                <i className={`la ${fitBadge.icon}`} style={{ fontSize: 14 }}></i>
                <span>{fitBadge.label}</span>
            </div>

            {/* Candidate Info */}
            <div className="candidate-info-section">
                <img src={image} alt={name} className="candidate-avatar" />
                <div className="candidate-details">
                    <div className="candidate-name">{name}</div>
                    <div className="candidate-email">{email}</div>
                </div>
                <div className="dropdown">
                    <button className="candidate-menu-btn" onClick={(e) => {
                        if (e.defaultPrevented) return;
                        e.preventDefault();
                        setMenuOpen(!menuOpen);
                    }}>
                        <i className="la la-ellipsis-h"></i>
                    </button>
                    {menuOpen && (
                        <div 
                        className={`dropdown-menu w-100 mt-1 org-dropdown-anim${
                            menuOpen ? " show" : ""
                            }`}
                        style={{
                            padding: "10px 0px",
                        }}
                        >
                            <div 
                            onClick={(e) => {
                                e.preventDefault();
                            }}
                            style={{ fontSize: 14, fontWeight: 700, color: "#414651", marginLeft: 15, cursor: "default" }}
                            >
                            <span>Candidate Menu</span>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item" onClick={(e) => {
                                e.preventDefault();
                                handleSelectMenuOption();
                            }}>
                                <i className="la la-bolt" style={{ fontSize: 16, marginRight: 4 }}></i>
                                <span>View Analysis by Jia</span>
                            </div>
                            <div className="dropdown-item" onClick={(e) => {
                                e.preventDefault();
                                handleViewCV();
                            }}>
                                <i className="la la-file-alt" style={{ fontSize: 16, marginRight: 4 }}></i>
                                <span>View CV</span>
                            </div>
                            <div className="dropdown-item" onClick={(e) => {
                                e.preventDefault();
                                handleViewHistory();
                            }}>
                                <i className="la la-history" style={{ fontSize: 16, marginRight: 4 }}></i>
                                <span>View Application History</span>
                            </div>
                            {/* Dropdown divider */}
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item" onClick={(e) => {
                                e.preventDefault();
                                handleEndorseCandidate({...candidate, stage});
                                setMenuOpen(!menuOpen);
                            }}>
                                <i className="la la-user-check" style={{ fontSize: 16, marginRight: 4 }}></i>
                                <span>Endorse Candidate</span>
                            </div>
                            <div className="dropdown-item" style={{ color: "#B42318" }} onClick={(e) => {
                                e.preventDefault();
                                handleDropCandidate({...candidate, stage});
                                setMenuOpen(!menuOpen);
                            }}>
                                <i className="la la-user-times" style={{ fontSize: 16, marginRight: 4 }}></i>
                                <span>Drop Candidate</span>
                            </div>
                            {hasPendingInterviewRetakeRequest && 
                            <>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-item" style={{ color: "#DC6803" }} onClick={(e) => {
                                    e.preventDefault();
                                    handleRetakeInterview({...candidate, stage});
                                    setMenuOpen(!menuOpen);
                                }}>
                                    <span>Review Retake Request</span>
                                </div>
                            </>
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Retake Request Warning */}
            {hasPendingInterviewRetakeRequest && 
            <div className="retake-warning">
                <i className="la la-exclamation-circle"></i>
                Retake Request
            </div>}

            {/* Footer */}
            <div className="candidate-footer">
                <div className="candidate-timestamp">{createdAt ? formatDateToRelativeTime(new Date(createdAt)) : "N/A"}</div>
                <div className="candidate-assessor">
                    <img src={isInReviewStage ? "/jia-avatar.png" : (candidate.applicationMetadata?.updatedBy?.image || "/jia-avatar.png")} alt="Assessor" className="assessor-avatar" />
                    <span>{isInReviewStage ? "Assessed by Jia" : (candidate.applicationMetadata?.action && candidate.applicationMetadata?.updatedBy ? `${candidate.applicationMetadata?.action} by ${candidate.applicationMetadata?.updatedBy?.name}` : "Assessed by Jia")}</span>
                </div>
            </div>
        </div>
    );
}