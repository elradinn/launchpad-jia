"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/lib/context/AppContext";
import axios from "axios";
import CareerStageColumn from "@/lib/components/CareerComponents/CareerStage";
import JobDescription from "@/lib/components/CareerComponents/JobDescription";
import HeaderBar from "@/lib/PageComponent/HeaderBar";
import CandidateMenu from "@/lib/components/CareerComponents/CandidateMenu";
import CandidateCV from "@/lib/components/CareerComponents/CandidateCV";
import DroppedCandidates from "@/lib/components/CareerComponents/DroppedCandidates";
import CareerApplicantsTable from "@/lib/components/DataTables/CareerApplicantsTable";
import Swal from "sweetalert2";
import CandidateHistory from "@/lib/components/CareerComponents/CandidateHistory";
import { useCareerApplicants } from "@/lib/hooks/useCareerApplicants";
import CareerStatus from "@/lib/components/CareerComponents/CareerStatus";
import CandidateActionModal from "@/lib/components/CandidateComponents/CandidateActionModal";
import { candidateActionToast, errorToast, getStage } from "@/lib/Utils";
import { Tooltip } from "react-tooltip";
import CareerFormV2 from "@/lib/components/CareerComponents/CareerFormV2";

export default function ManageCareerPage() {
    const { slug } = useParams();
    const searchParams = useSearchParams();
    const tab = searchParams.get("tab");
    const { orgID, user } = useAppContext();
    const [career, setCareer] = useState<any>(null);
    const { timelineStages, interviewsInProgress, dropped, hired, setAndSortCandidates } = useCareerApplicants({
        "CV Review": {
            candidates: [],
            droppedCandidates: [],
            color: "#6941C6",
            nextStage: {
                name: "Pending AI Interview",
                step: "AI Interview",
                status: "For Interview"
            },
            currentStage: {
                name: "CV Review",
                step: "CV Screening",
                status: "For CV Screening"
            }
        },
        "Pending AI Interview": {
            candidates: [],
            droppedCandidates: [],
            // Orange
            color: "#D97706",
            nextStage: {
                name: "AI Interview Review",
                step: "AI Interview",
                status: "For AI Interview Review"
            },
            currentStage: {
                name: "Pending AI Interview",
                step: "CV Screening",
                status: "For AI Interview"
            }
        },
        "AI Interview Review": {
            candidates: [],
            droppedCandidates: [],
            // Light Blue
            color: "#00CEC8",
            nextStage: {
                name: "For Human Interview",
                step: "Human Interview",
                status: "For Human Interview"
            },
            currentStage: {
                name: "AI Interview Review",
                step: "AI Interview",
                status: "For AI Interview Review"
            }
        },
        "For Human Interview": {
            candidates: [],
            droppedCandidates: [],
            color: "#B42318",
            nextStage: {
                name: "Human Interview Review",
                step: "Human Interview",
                status: "For Human Interview Review"
            },
            currentStage: {
                name: "For Human Interview",
                step: "Human Interview",
                status: "For Human Interview"
            }
        },
        "Human Interview Review": {
            candidates: [],
            droppedCandidates: [],
            // Violet
            color: "#7E3AF2",
            nextStage: {
                name: "Pending Job Interview",
                step: "Job Interview",
                status: "For Interview"
            },
            currentStage: {
                name: "Human Interview Review",
                step: "Human Interview",
                status: "For Human Interview Review"
            }
        },
        "Pending Job Interview": {
            candidates: [],
            droppedCandidates: [],
            // Blue
            color: "#1849D5",
            nextStage: {
                name: "Job Offered",
                step: "Job Offered",
                status: "Accepted"
            },
            currentStage: {
                name: "Pending Job Interview",
                step: "Job Interview",
                status: "For Interview"
            }
        },
        "Job Offered": {
            candidates: [],
            droppedCandidates: [],
            // Brown
            color: "#854D0E",
            nextStage: {
                name: "Contract Signed",
                step: "Contract Signed",
                status: "Accepted"
            },
            currentStage: {
                name: "Job Offered",
                step: "Job Offered",
                status: "Accepted"
            }
        },
        "Contract Signed": {
            candidates: [],
            droppedCandidates: [],
            // Light Green
            color: "#80EF80",
            nextStage: {
                name: "Hired",
                step: "Hired",
                status: "Accepted"
            },
            currentStage: {
                name: "Contract Signed",
                step: "Contract Signed",
                status: "Accepted"
            }
        },
    });
    const [activeTab, setActiveTab] = useState("application-timeline");
    const [candidateMenuOpen, setCandidateMenuOpen] = useState<boolean>(false);
    const [selectedCandidate, setSelectedCandidate] = useState<any>({});
    const [candidateCVOpen, setCandidateCVOpen] = useState<boolean>(false);
    const [selectedCandidateCV, setSelectedCandidateCV] = useState<any>({});
    const [droppedCandidatesOpen, setDroppedCandidatesOpen] = useState<boolean>(false);
    const [selectedDroppedCandidates, setSelectedDroppedCandidates] = useState<any>({});
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({
        _id: "",
        jobTitle: "",
        description: "",
        questions: [],
        status: "",
        screeningSetting: "",
        requireVideo: false,
        directInterviewLink: "",
        preScreeningQuestions: [],
    });
    const [showCandidateHistory, setShowCandidateHistory] = useState(false);
    const [selectedCandidateHistory, setSelectedCandidateHistory] = useState<any>({});
    const [showCandidateActionModal, setShowCandidateActionModal] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [editSection, setEditSection] = useState("");
    const draggedCandidateRef = useRef<boolean>(false);
    const [openAccordion, setOpenAccordion] = useState("Career Details & Team Access");

    const tabs = [
        {
            label: "Application Timeline",
            value: "application-timeline",
            icon: "stream",
        },
        {
            label: "All Applicants",
            value: "all-applicants",
            icon: "users",
        },
        {
            label: "Career Description",
            value: "job-description",
            icon: "suitcase",
        },
    ];

    useEffect(() => {
        const fetchInterviews = async () => {
            if (!career?.id) return;

            const response = await axios.get(`/api/get-career-interviews?careerID=${career.id}`);
            if (response.data.length > 0) {
                let newTimelineStages = { ...timelineStages };
                for (const interview of response.data) {

                    const isDropped = interview.applicationStatus === "Dropped" || interview.applicationStatus === "Cancelled";
                    if (interview.currentStep === "AI Interview" || !interview.currentStep || (interview.currentStep === "CV Screening" && interview.status === "For AI Interview")) {
                        if (interview.status === "For Interview" || interview.status === "For AI Interview") {
                            isDropped ? newTimelineStages["Pending AI Interview"].droppedCandidates.push(interview) : newTimelineStages["Pending AI Interview"].candidates.push(interview);
                            continue;
                        }

                        isDropped ? newTimelineStages["AI Interview Review"].droppedCandidates.push(interview) : newTimelineStages["AI Interview Review"].candidates.push(interview);
                        continue;
                    }

                    if (interview.currentStep === "CV Screening") {
                        isDropped ? newTimelineStages["CV Review"].droppedCandidates.push(interview) : newTimelineStages["CV Review"].candidates.push(interview);
                        continue;
                    }

                    if (interview.currentStep === "Human Interview") {
                        if (interview.status === "For Human Interview") {
                            isDropped ? newTimelineStages["For Human Interview"].droppedCandidates.push(interview) : newTimelineStages["For Human Interview"].candidates.push(interview);
                            continue;
                        }
                        if (interview.status === "For Human Interview Review") {
                            isDropped ? newTimelineStages["Human Interview Review"].droppedCandidates.push(interview) : newTimelineStages["Human Interview Review"].candidates.push(interview);
                            continue;
                        }
                    }

                    if (interview.currentStep === "Job Interview") {
                        isDropped ? newTimelineStages["Pending Job Interview"].droppedCandidates.push(interview) : newTimelineStages["Pending Job Interview"].candidates.push(interview);
                        continue;
                    }

                    if (interview.currentStep === "Job Offered") {
                        isDropped ? newTimelineStages["Job Offered"].droppedCandidates.push(interview) : newTimelineStages["Job Offered"].candidates.push(interview);
                        continue;
                    }

                    if (interview.currentStep === "Contract Signed") {
                        isDropped ? newTimelineStages["Contract Signed"].droppedCandidates.push(interview) : newTimelineStages["Contract Signed"].candidates.push(interview);
                        continue;
                    }
                }

                setAndSortCandidates(newTimelineStages);
            }
        };

        fetchInterviews();
    }, [career?.id]);

    useEffect(() => {
        const fetchCareer = async () => {
            if (!slug && !orgID) return;
            try {
                const response = await axios.post("/api/career-data", {
                    id: slug,
                    orgID,
                });

                setCareer(response.data);
                const deepCopy = JSON.parse(JSON.stringify(response.data?.questions ?? []));
                setFormData({
                    _id: response.data?._id || "",
                    jobTitle: response.data?.jobTitle || "",
                    description: response.data?.description || "",
                    questions: deepCopy,
                    status: response.data?.status || "",
                    screeningSetting: response.data?.screeningSetting || "",
                    requireVideo: response.data?.requireVideo === null || response.data?.requireVideo === undefined ? true : response.data?.requireVideo,
                    directInterviewLink: response.data?.directInterviewLink || "",
                    createdBy: response.data?.createdBy || {},
                    minimumSalary: response.data?.minimumSalary || "",
                    maximumSalary: response.data?.maximumSalary || "",
                    province: response.data?.province || "",
                    location: response.data?.location || "",
                    salaryNegotiable: response.data?.salaryNegotiable || false,
                    workSetup: response.data?.workSetup || "",
                    workSetupRemarks: response.data?.workSetupRemarks || "",
                    createdAt: response.data?.createdAt || "",
                    updatedAt: response.data?.updatedAt || "",
                    lastEditedBy: response.data?.lastEditedBy || {},
                    employmentType: response.data?.employmentType || "Full-time",
                    orgID: response.data?.orgID || "",
                    unpublishedLatestStep: response.data?.unpublishedLatestStep || "Career Details & Team Access",
                    preScreeningQuestions: response.data?.preScreeningQuestions || [],
                });
                if (tab === "edit") {
                    setActiveTab("job-description");
                    // For unpublished careers, the form will show directly in the tab
                    // For published careers, user will click edit icon on accordion sections
                }
            } catch (error) {
                if (error.response.status === 404) {
                    Swal.fire({
                        title: "Career not found",
                        text: "Redirecting back to careers page...",
                        timer: 1500,
                    }).then(() => {
                        window.location.href = "/recruiter-dashboard/careers";
                    });
                    return;
                }
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "Something went wrong! Please try again.",
                });
            }
        }
        fetchCareer();
    }, [slug, orgID, tab]);

    const handleCandidateMenuOpen = (candidate: any) => {
        setCandidateMenuOpen(prev => !prev);
        setSelectedCandidate(candidate);
    }

    const handleCandidateCVOpen = (candidate: any) => {
        setCandidateCVOpen(prev => !prev);
        setSelectedCandidateCV(candidate);
    }

    const handleDroppedCandidatesOpen = (stage: string) => {
        setDroppedCandidatesOpen(prev => !prev);
        setSelectedDroppedCandidates({ ...timelineStages[stage], stage });
    }

    const handleCandidateHistoryOpen = (candidate: any) => {
        setShowCandidateHistory(prev => !prev);
        setSelectedCandidateHistory(candidate);
    }

    const handleCandidateAnalysisComplete = (updatedCandidate: any) => {
        const updatedStages = { ...timelineStages };
        updatedStages[updatedCandidate.stage].candidates = updatedStages[updatedCandidate.stage].candidates.map((c: any) => c._id === updatedCandidate._id ? updatedCandidate : c);
        setAndSortCandidates(updatedStages);
    }

    const handleCancelEdit = () => {
        setFormData({
            _id: career?._id || "",
            jobTitle: career?.jobTitle || "",
            description: career?.description || "",
            questions: career?.questions || [],
            status: career?.status || "",
            screeningSetting: career?.screeningSetting || "",
            requireVideo: career?.requireVideo === null || career?.requireVideo === undefined ? true : career?.requireVideo,
            preScreeningQuestions: career?.preScreeningQuestions || [],
        });
        setIsEditing(false);
    }

    const handleEndorseCandidate = (candidate: any) => {
        setShowCandidateActionModal("endorse");
        setSelectedCandidate(candidate);
    }

    const handleDropCandidate = (candidate: any) => {
        setShowCandidateActionModal("drop");
        setSelectedCandidate(candidate);
    }

    const dragEndorsedCandidate = (candidateId: string, fromStageKey: string, toStageKey: string) => {
        const candidateIndex = (timelineStages?.[fromStageKey]?.candidates as any[]).findIndex((c) => c._id.toString() === candidateId);
        const currentStage = timelineStages?.[toStageKey]?.currentStage;
        const update = {
            currentStep: currentStage.step,
            status: currentStage.status,
            updatedAt: Date.now(),
            applicationMetadata: {
                updatedAt: Date.now(),
                updatedBy: {
                    image: user?.image,
                    name: user?.name,
                    email: user?.email,
                },
                action: "Endorsed",
            }
        }
        if (candidateIndex !== -1) {
            const updatedStages = { ...timelineStages }
            const candidate = updatedStages?.[fromStageKey]?.candidates?.[candidateIndex];
            // Remove and add to new stage

            (updatedStages?.[toStageKey]?.candidates as any[]).push({ ...candidate, ...update });
            (updatedStages?.[fromStageKey]?.candidates as any[]).splice(candidateIndex, 1);
            setAndSortCandidates(updatedStages);
            draggedCandidateRef.current = true;
            setShowCandidateActionModal("endorse");
            setSelectedCandidate({ ...candidate, stage: fromStageKey, toStage: toStageKey });
        }
    }

    const handleReconsiderCandidate = (candidate: any) => {
        setShowCandidateActionModal("reconsider");
        setSelectedCandidate(candidate);
    }

    const handleRetakeInterview = async (candidate: any) => {
        setShowCandidateActionModal("retake");
        setSelectedCandidate(candidate);
    }

    const handleCandidateAction = async (action: string) => {
        setShowCandidateActionModal("");
        if (action === "endorse") {
            Swal.showLoading();
            const { stage, toStage } = selectedCandidate;
            const nextStage = toStage ? timelineStages[toStage].currentStage : timelineStages[stage].nextStage;
            try {
                const update = {
                    currentStep: nextStage.step,
                    status: nextStage.status,
                    updatedAt: Date.now(),
                    applicationMetadata: {
                        updatedAt: Date.now(),
                        updatedBy: {
                            image: user?.image,
                            name: user?.name,
                            email: user?.email,
                        },
                        action: "Endorsed",
                    }
                }
                await axios.post("/api/update-interview", {
                    uid: selectedCandidate._id,
                    data: update,
                    interviewTransaction: {
                        interviewUID: selectedCandidate._id,
                        fromStage: stage,
                        toStage: nextStage.name,
                        action: "Endorsed",
                        updatedBy: {
                            image: user?.image,
                            name: user?.name,
                            email: user?.email,
                        },
                    }
                });
                if (!draggedCandidateRef.current) {
                    const updatedStages = { ...timelineStages };
                    updatedStages[stage].candidates = updatedStages[stage].candidates.filter((c: any) => c._id !== selectedCandidate._id);
                    updatedStages[nextStage.name].candidates.push({ ...selectedCandidate, ...update });
                    setAndSortCandidates(updatedStages);
                }
                candidateActionToast(
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Candidate endorsed</span>
                            <span style={{ fontSize: 14, color: "#717680", fontWeight: 500, whiteSpace: "nowrap" }}>You have endorsed the candidate to the next stage.</span>
                        </div>
                    </div>,
                    1300,
                    <i className="la la-user-check" style={{ color: "#039855", fontSize: 32 }}></i>)
            } catch (error) {
                console.error("error", error);
                errorToast("Failed to endorse candidate", 1300);
            } finally {
                Swal.close();
            }
        }

        if (action === "drop") {
            Swal.showLoading();
            try {
                const { stage } = selectedCandidate;
                const update = {
                    applicationStatus: "Dropped",
                    updatedAt: Date.now(),
                    applicationMetadata: {
                        updatedAt: Date.now(),
                        updatedBy: {
                            image: user?.image,
                            name: user?.name,
                            email: user?.email,
                        },
                        action: "Dropped",
                    }
                }
                await axios.post("/api/update-interview", {
                    uid: selectedCandidate._id,
                    data: update,
                    // For logging history
                    interviewTransaction: {
                        interviewUID: selectedCandidate._id,
                        fromStage: stage,
                        action: "Dropped",
                        updatedBy: {
                            image: user?.image,
                            name: user?.name,
                            email: user?.email,
                        },
                    }
                });
                // Update state
                if (timelineStages?.[stage]) {
                    const updatedStages = { ...timelineStages };
                    updatedStages[stage].droppedCandidates.push({ ...selectedCandidate, ...update });
                    updatedStages[stage].candidates = updatedStages[stage].candidates.filter((c: any) => c._id !== selectedCandidate._id);
                    setAndSortCandidates(updatedStages);
                }
                candidateActionToast(
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Candidate dropped</span>
                            <span style={{ fontSize: 14, color: "#717680", fontWeight: 500, whiteSpace: "nowrap" }}>You have dropped the candidate from the application process. </span>
                        </div>
                    </div>,
                    1300,
                    <i className="la la-user-minus" style={{ color: "#D92D20", fontSize: 32 }}></i>)
            } catch (error) {
                console.error("error", error);
                errorToast("Failed to drop candidate", 1300);
            } finally {
                Swal.close();
            }
        }

        if (action === "reconsider") {
            Swal.showLoading();
            try {
                const { stage } = selectedCandidate;
                const update = {
                    applicationStatus: "Ongoing",
                    updatedAt: Date.now(),
                    applicationMetadata: {
                        updatedAt: Date.now(),
                        updatedBy: {
                            image: user?.image,
                            name: user?.name,
                            email: user?.email,
                        },
                        action: "Reconsidered",
                    }
                };
                await axios.post("/api/update-interview", {
                    uid: selectedCandidate._id,
                    data: update,
                    interviewTransaction: {
                        interviewUID: selectedCandidate._id,
                        fromStage: stage,
                        action: "Reconsidered",
                        updatedBy: {
                            image: user?.image,
                            name: user?.name,
                            email: user?.email,
                        },
                    }
                });
                if (timelineStages?.[stage]) {
                    const updatedStages = { ...timelineStages };
                    updatedStages[stage].droppedCandidates = updatedStages[stage].droppedCandidates.filter((c: any) => c._id !== selectedCandidate._id);
                    updatedStages[stage].candidates.push({ ...selectedCandidate, ...update });
                    setAndSortCandidates(updatedStages);
                }
                candidateActionToast(
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Candidate reconsidered</span>
                            <span style={{ fontSize: 14, color: "#717680", fontWeight: 500, whiteSpace: "nowrap" }}>You have reconsidered the candidate back to the ongoing stage.</span>
                        </div>
                    </div>,
                    1300,
                    <i className="la la-user-check" style={{ color: "#039855", fontSize: 32 }}></i>)
            } catch (error) {
                console.error("error", error);
                errorToast("Failed to reconsider candidate", 1300);
            } finally {
                Swal.close();
            }
        }
        if (action === "approve") {
            Swal.showLoading();
            // reset interview data
            try {
                await axios.post("/api/reset-interview-data", {
                    id: selectedCandidate._id,
                });

                await axios.post("/api/update-interview", {
                    uid: selectedCandidate._id,
                    data: {
                        retakeRequest: {
                            status: "Approved",
                            updatedAt: Date.now(),
                            approvedBy: {
                                image: user.image,
                                name: user.name,
                                email: user.email,
                            },
                        },
                    },
                    interviewTransaction: {
                        interviewUID: selectedCandidate._id,
                        fromStage: getStage(selectedCandidate),
                        toStage: "Pending AI Interview",
                        action: "Endorsed",
                        updatedBy: {
                            image: user?.image,
                            name: user?.name,
                            email: user?.email,
                        },
                    },
                });
                Swal.close();
                candidateActionToast(
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Approved request</span>
                            <span style={{ fontSize: 14, color: "#717680", fontWeight: 500, whiteSpace: "nowrap" }}>You have approved <strong>{selectedCandidate?.name}'s</strong> request to retake interview.</span>
                        </div>
                    </div>,
                    1300,
                    <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>)
                setTimeout(() => {
                    window.location.href = `/recruiter-dashboard/careers/manage/${slug}`;
                }, 1300);
            } catch (error) {
                console.error("error", error);
                Swal.close();
                errorToast("Failed to approve request", 1300);
            }
        }

        if (action === "reject") {
            Swal.showLoading();
            try {
                await axios.post("/api/update-interview", {
                    uid: selectedCandidate._id,
                    data: {
                        retakeRequest: {
                            status: "Rejected",
                            updatedAt: Date.now(),
                            approvedBy: {
                                image: user.image,
                                name: user.name,
                                email: user.email,
                            },
                        },
                    },
                });

                Swal.close();
                candidateActionToast(
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Rejected request</span>
                            <span style={{ fontSize: 14, color: "#717680", fontWeight: 500, whiteSpace: "nowrap" }}>You have rejected <strong>{selectedCandidate?.name}'s</strong> request to retake interview.</span>
                        </div>
                    </div>,
                    1300,
                    <i className="la la-times-circle" style={{ color: "#D92D20", fontSize: 32 }}></i>)
                setTimeout(() => {
                    window.location.href = `/recruiter-dashboard/careers/manage/${slug}`;
                }, 1300);
            } catch (error) {
                console.error("error", error);
                Swal.close();
                errorToast("Failed to reject request", 1300);
            }
        }

        if (!action && draggedCandidateRef.current) {
            // Revert the changes since cancelled
            const { stage, toStage } = selectedCandidate;
            const revertedStages = { ...timelineStages };
            const newCandidateIndex = (revertedStages?.[toStage]?.candidates as any[]).findIndex((c) => c._id.toString() === selectedCandidate._id);
            (revertedStages?.[stage]?.candidates as any[]).push(selectedCandidate);
            (revertedStages?.[toStage]?.candidates as any[]).splice(newCandidateIndex, 1);
            setAndSortCandidates(revertedStages);
            draggedCandidateRef.current = false;
        }
    }
    return (
        <>
            {/* Header */}
            <HeaderBar activeLink="Careers" currentPage={formData.jobTitle} icon="la la-suitcase" />
            <div className="container-fluid mt--7" style={{ paddingTop: "6rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {isEditing ?
                        <input
                            type="text"
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            style={{ color: "#030217", fontWeight: 550, fontSize: 30, width: "70%" }}
                        />
                        : <div style={{ maxWidth: "70%" }}>
                            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <h1 style={{ color: "#030217", fontWeight: 550, fontSize: 30 }}>{formData.jobTitle}</h1>
                                <CareerStatus status={formData.status} />
                            </div>
                        </div>}
                    {/* <div style={{ display: "flex", gap: 16, alignItems: "center", textAlign: "center" }}>
                <div style={{ color: "#030217" }}>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{hired}</div>
                    <div style={{ fontSize: 14 }}>Hired</div>
                </div>
                <div style={{ width: 1, height: "50px", background: "#E9EAEB", marginLeft: "15px", marginRight: "15px" }} />
                <div  style={{ color: "#030217" }}>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{interviewsInProgress}</div>
                    <div style={{ fontSize: 14 }}>In Progress</div>
                </div>
                <div style={{ width: 1, height: "50px", background: "#E9EAEB", marginLeft: "15px", marginRight: "15px"  }} />
                <div style={{ color: "#030217" }}>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{dropped}</div>
                    <div style={{ fontSize: 14 }}>Dropped</div>
                </div> 
                </div> */}

                    {/* Export candidates button */}
                    {interviewsInProgress > 0 && <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        <button
                            style={{
                                background: "white",
                                border: "1px solid #E9EAEB",
                                borderRadius: 60,
                                padding: "8px 16px",
                                fontSize: 14,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                // Download spreadsheed file of all candidates
                                const candidates = Object.keys(timelineStages).flatMap((key) => {
                                    const stage = timelineStages[key];
                                    if (stage.candidates.length > 0) {
                                        return stage.candidates.map((candidate) => {
                                            return {
                                                ...candidate,
                                                stage: key,
                                            }
                                        });
                                    }
                                    return [];
                                });
                                const csvContent = "data:text/csv;charset=utf-8,NAME,EMAIL,JOB TITLE,DATE APPLIED,APPLICATION STAGE,CV SCREENING RATING,AI INTERVIEW RATING" + "\n" + candidates.map((candidate) => {
                                    return [
                                        candidate.name?.replace(/,/g, ""),
                                        candidate.email?.replace(/,/g, ""),
                                        career.jobTitle?.replace(/,/g, ""),
                                        new Date(candidate.createdAt).toLocaleDateString(),
                                        candidate.stage,
                                        candidate.cvStatus || "N/A",
                                        candidate.jobFit || "N/A",
                                    ]
                                }).join("\n");
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", `${career.jobTitle}-Candidates-${new Date().toLocaleDateString()}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}>
                            <i className="la la-file-alt" style={{ fontSize: 20, marginRight: 8 }}></i>
                            Export Candidates
                        </button>
                    </div>}
                </div>
                <div style={{ padding: "16px 0 48px", background: "#FDFDFD", minHeight: "100vh" }}>
                    {/* Tabs */}
                    <div className="career-tab-container">
                        <div className="career-tab-content">
                            {tabs.map((tab) => (
                                <div
                                    key={tab.value}
                                    className={`career-tab-item ${activeTab === tab.value ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.value)}>
                                    <i className={`la la-${tab.icon}`} style={{ fontSize: 20, marginRight: 8 }}></i>
                                    {tab.label}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Career Tab Information */}
                    {activeTab === "application-timeline" && <CareerStageColumn
                        timelineStages={timelineStages}
                        handleCandidateMenuOpen={handleCandidateMenuOpen}
                        handleCandidateCVOpen={handleCandidateCVOpen}
                        handleDroppedCandidatesOpen={handleDroppedCandidatesOpen}
                        handleEndorseCandidate={handleEndorseCandidate}
                        handleDropCandidate={handleDropCandidate}
                        dragEndorsedCandidate={dragEndorsedCandidate}
                        handleCandidateHistoryOpen={handleCandidateHistoryOpen}
                        handleRetakeInterview={handleRetakeInterview}
                    />}
                    {activeTab === "all-applicants" && <CareerApplicantsTable slug={career?.id} />}
                    {activeTab === "job-description" && (
                        <>
                            {/* Show CareerFormV2 directly for unpublished careers */}
                            {formData.status === "inactive" && formData.unpublishedLatestStep ? (
                                <div style={{ marginTop: 24 }}>
                                    <CareerFormV2
                                        career={formData}
                                        mode="edit"
                                        initialSection={formData.unpublishedLatestStep}
                                    />
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "row", gap: 24, marginTop: 24 }}>
                                    {/* Left Column - Accordions */}
                                    <div style={{ flex: "0 0 65%", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
                                {/* Career Details & Team Access Accordion */}
                                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                                    <button
                                        onClick={() => setOpenAccordion(openAccordion === "Career Details & Team Access" ? "" : "Career Details & Team Access")}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "16px 20px",
                                            background: "#F9FAFB",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: "#181D27"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <i className={`la la-angle-${openAccordion === "Career Details & Team Access" ? 'down' : 'right'}`} style={{ fontSize: 20, color: "#6B7280" }}></i>
                                            <span>Career Details & Team Access</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditSection("Career Details & Team Access");
                                                setShowEditModal(true);
                                            }}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: 4
                                            }}
                                        >
                                            <i className="la la-pen" style={{ fontSize: 18, color: "#6B7280" }}></i>
                                        </button>
                                    </button>

                                    {openAccordion === "Career Details & Team Access" && (
                                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column" }}>
                                            {/* Job Title */}
                                            <div style={{ paddingBottom: 20 }}>
                                                <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Job Title</span>
                                                <span style={{ fontSize: 14, color: "#181D27" }}>{formData.jobTitle || "—"}</span>
                                            </div>

                                            <div style={{ height: 1, background: "#E5E7EB", marginBottom: 20 }} />

                                            {/* Employment Type & Work Arrangement */}
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, paddingBottom: 20 }}>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>Employment Type</span>
                                                    <span style={{ fontSize: 14, color: "#181D27" }}>{formData.employmentType || "Full-time"}</span>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>Work Arrangement</span>
                                                    <span style={{ fontSize: 14, color: "#181D27" }}>{formData.workSetup || "Hybrid"}</span>
                                                </div>
                                            </div>

                                            <div style={{ height: 1, background: "#E5E7EB", marginBottom: 20 }} />

                                            {/* Location */}
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, paddingBottom: 20 }}>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>Country</span>
                                                    <span style={{ fontSize: 14, color: "#181D27" }}>Philippines</span>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>State / Province</span>
                                                    <span style={{ fontSize: 14, color: "#181D27" }}>{formData.province || "Metro Manila"}</span>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>City</span>
                                                    <span style={{ fontSize: 14, color: "#181D27" }}>{formData.location || "Pasig City"}</span>
                                                </div>
                                            </div>

                                            <div style={{ height: 1, background: "#E5E7EB", marginBottom: 20 }} />

                                            {/* Salary */}
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, paddingBottom: 20 }}>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>Minimum Salary</span>
                                                    <span style={{ fontSize: 14, color: "#181D27" }}>
                                                        {formData.salaryNegotiable ? "Negotiable" : formData.minimumSalary ? `₱${formData.minimumSalary} PHP` : "—"}
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>Maximum Salary</span>
                                                    <span style={{ fontSize: 14, color: "#181D27" }}>
                                                        {formData.salaryNegotiable ? "Negotiable" : formData.maximumSalary ? `₱${formData.maximumSalary} PHP` : "—"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ height: 1, background: "#E5E7EB", marginBottom: 20 }} />

                                            {/* Job Description */}
                                            <div>
                                                <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, display: "block", marginBottom: 8 }}>Job Description</span>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        color: "#181D27",
                                                        lineHeight: 1.6,
                                                        maxHeight: 300,
                                                        overflow: "auto"
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: formData.description || "—" }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* CV Review & Pre-Screening Questions Accordion */}
                                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                                    <button
                                        onClick={() => setOpenAccordion(openAccordion === "CV Review & Pre-screening" ? "" : "CV Review & Pre-screening")}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "16px 20px",
                                            background: "#F9FAFB",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: "#181D27"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <i className={`la la-angle-${openAccordion === "CV Review & Pre-screening" ? 'down' : 'right'}`} style={{ fontSize: 20, color: "#6B7280" }}></i>
                                            <span>CV Review & Pre-screening</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditSection("CV Review & Pre-screening");
                                                setShowEditModal(true);
                                            }}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: 4
                                            }}
                                        >
                                            <i className="la la-pen" style={{ fontSize: 18, color: "#6B7280" }}></i>
                                        </button>
                                    </button>

                                    {openAccordion === "CV Review & Pre-screening" && (
                                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
                                            {/* CV Screening */}
                                            <div>
                                                <span style={{ fontSize: 14, color: "#181D27", fontWeight: 600, display: "block", marginBottom: 8 }}>CV Screening</span>
                                                <div style={{ fontSize: 14, color: "#6B7280" }}>
                                                    Automatically endorse candidates who are{" "}
                                                    <span style={{
                                                        color: "#3B82F6",
                                                        fontWeight: 600,
                                                        background: "#EFF6FF",
                                                        padding: "2px 8px",
                                                        borderRadius: 4
                                                    }}>
                                                        {formData.screeningSetting || "Good Fit and above"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Pre-Screening Questions */}
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                                    <span style={{ fontSize: 14, color: "#181D27", fontWeight: 600 }}>Pre-Screening Questions</span>
                                                    <span style={{
                                                        background: "#F3F4F6",
                                                        color: "#6B7280",
                                                        padding: "2px 8px",
                                                        borderRadius: "12px",
                                                        fontSize: 12,
                                                        fontWeight: 600
                                                    }}>
                                                        {formData.preScreeningQuestions?.length || 0}
                                                    </span>
                                                </div>
                                                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "#181D27", lineHeight: 2 }}>
                                                    {formData.preScreeningQuestions?.map((q, idx) => (
                                                        <li key={q.id || idx} style={{ marginBottom: 12 }}>
                                                            <div style={{ fontWeight: 500, marginBottom: 4 }}>{q.question}</div>
                                                            {q.type === "Dropdown" && q.options?.length > 0 && (
                                                                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                                                                    {q.options.map((opt, optIdx) => (
                                                                        <li key={optIdx}>{opt}</li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                            {q.type === "Range" && (
                                                                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                                                                    Preferred: PHP {q.rangeMin?.toLocaleString()} - PHP {q.rangeMax?.toLocaleString()}
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* AI Interview Setup Accordion */}
                                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                                    <button
                                        onClick={() => setOpenAccordion(openAccordion === "AI Interview Setup" ? "" : "AI Interview Setup")}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "16px 20px",
                                            background: "#F9FAFB",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: "#181D27"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <i className={`la la-angle-${openAccordion === "AI Interview Setup" ? 'down' : 'right'}`} style={{ fontSize: 20, color: "#6B7280" }}></i>
                                            <span>AI Interview Setup</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditSection("AI Interview Setup");
                                                setShowEditModal(true);
                                            }}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: 4
                                            }}
                                        >
                                            <i className="la la-pen" style={{ fontSize: 18, color: "#6B7280" }}></i>
                                        </button>
                                    </button>

                                    {openAccordion === "AI Interview Setup" && (
                                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
                                            {/* Require Video on Interview */}
                                            <div>
                                                <span style={{ fontSize: 14, color: "#181D27", fontWeight: 600, display: "block", marginBottom: 8 }}>Require Video on Interview</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontSize: 14, color: "#6B7280" }}>{formData.requireVideo ? "Yes" : "No"}</span>
                                                    {formData.requireVideo && (
                                                        <i className="la la-check-circle" style={{ color: "#10B981", fontSize: 18 }}></i>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Interview Questions */}
                                            {formData.questions && formData.questions.some((cat: any) => cat.questions && cat.questions.length > 0) && (
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                                        <span style={{ fontSize: 14, color: "#181D27", fontWeight: 600 }}>Interview Questions</span>
                                                        <span style={{
                                                            background: "#F3F4F6",
                                                            color: "#6B7280",
                                                            padding: "2px 8px",
                                                            borderRadius: "12px",
                                                            fontSize: 12,
                                                            fontWeight: 600
                                                        }}>
                                                            {formData.questions.reduce((total: number, cat: any) => total + (cat.questions?.length || 0), 0)}
                                                        </span>
                                                    </div>

                                                    {formData.questions.filter((cat: any) => cat.questions && cat.questions.length > 0).map((category: any) => (
                                                        <div key={category.id} style={{ marginBottom: 16 }}>
                                                            <span style={{ fontSize: 14, color: "#181D27", fontWeight: 600, display: "block", marginBottom: 8 }}>
                                                                {category.category}
                                                            </span>
                                                            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "#6B7280", lineHeight: 1.8 }}>
                                                                {category.questions.map((q: any, idx: number) => (
                                                                    <li key={idx}>{typeof q === 'string' ? q : q.question}</li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Pipeline Stages Accordion */}
                                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                                    <button
                                        onClick={() => setOpenAccordion(openAccordion === "Pipeline Stages" ? "" : "Pipeline Stages")}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "16px 20px",
                                            background: "#F9FAFB",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: "#181D27"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <i className={`la la-angle-${openAccordion === "Pipeline Stages" ? 'down' : 'right'}`} style={{ fontSize: 20, color: "#6B7280" }}></i>
                                            <span>Pipeline Stages</span>
                                            <span style={{
                                                background: "#F3F4F6",
                                                color: "#6B7280",
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                                fontSize: 12,
                                                fontWeight: 600
                                            }}>
                                                4
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditSection("Pipeline Stages");
                                                setShowEditModal(true);
                                            }}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: 4
                                            }}
                                        >
                                            <i className="la la-pen" style={{ fontSize: 18, color: "#6B7280" }}></i>
                                        </button>
                                    </button>

                                    {openAccordion === "Pipeline Stages" && (
                                        <div style={{ padding: "20px 24px" }}>
                                            <div style={{
                                                display: "flex",
                                                gap: 16,
                                                overflowX: "auto",
                                                paddingBottom: 8
                                            }}>
                                                {/* CV Screening Stage */}
                                                <div style={{
                                                    minWidth: 240,
                                                    background: "#F9FAFB",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: 12,
                                                    padding: 16,
                                                    flex: "0 0 auto"
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                                        <i className="la la-file-text" style={{ fontSize: 18, color: "#6B7280" }}></i>
                                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#181D27" }}>CV Screening</span>
                                                    </div>
                                                    <div style={{ marginBottom: 8 }}>
                                                        <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Substages</span>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                        <div style={{
                                                            background: "#fff",
                                                            border: "1px solid #E5E7EB",
                                                            borderRadius: 8,
                                                            padding: "10px 12px",
                                                            fontSize: 13,
                                                            color: "#6B7280"
                                                        }}>
                                                            Waiting Submission
                                                        </div>
                                                        <div style={{
                                                            background: "#fff",
                                                            border: "1px solid #E5E7EB",
                                                            borderRadius: 8,
                                                            padding: "10px 12px",
                                                            fontSize: 13,
                                                            color: "#6B7280"
                                                        }}>
                                                            For Review
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* AI Interview Stage */}
                                                <div style={{
                                                    minWidth: 240,
                                                    background: "#F9FAFB",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: 12,
                                                    padding: 16,
                                                    flex: "0 0 auto"
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                                        <i className="la la-robot" style={{ fontSize: 18, color: "#6B7280" }}></i>
                                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#181D27" }}>AI Interview</span>
                                                    </div>
                                                    <div style={{ marginBottom: 8 }}>
                                                        <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Substages</span>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                        <div style={{
                                                            background: "#fff",
                                                            border: "1px solid #E5E7EB",
                                                            borderRadius: 8,
                                                            padding: "10px 12px",
                                                            fontSize: 13,
                                                            color: "#6B7280"
                                                        }}>
                                                            Waiting Interview
                                                        </div>
                                                        <div style={{
                                                            background: "#fff",
                                                            border: "1px solid #E5E7EB",
                                                            borderRadius: 8,
                                                            padding: "10px 12px",
                                                            fontSize: 13,
                                                            color: "#6B7280"
                                                        }}>
                                                            For Review
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Final Human Interview Stage */}
                                                <div style={{
                                                    minWidth: 240,
                                                    background: "#F9FAFB",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: 12,
                                                    padding: 16,
                                                    flex: "0 0 auto"
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                                        <i className="la la-users" style={{ fontSize: 18, color: "#6B7280" }}></i>
                                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#181D27" }}>Final Human Interview</span>
                                                    </div>
                                                    <div style={{ marginBottom: 8 }}>
                                                        <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Substages</span>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                        <div style={{
                                                            background: "#fff",
                                                            border: "1px solid #E5E7EB",
                                                            borderRadius: 8,
                                                            padding: "10px 12px",
                                                            fontSize: 13,
                                                            color: "#6B7280"
                                                        }}>
                                                            Waiting Schedule
                                                        </div>
                                                        <div style={{
                                                            background: "#fff",
                                                            border: "1px solid #E5E7EB",
                                                            borderRadius: 8,
                                                            padding: "10px 12px",
                                                            fontSize: 13,
                                                            color: "#6B7280"
                                                        }}>
                                                            Waiting Interview
                                                        </div>
                                                        <div style={{
                                                            background: "#fff",
                                                            border: "1px solid #E5E7EB",
                                                            borderRadius: 8,
                                                            padding: "10px 12px",
                                                            fontSize: 13,
                                                            color: "#6B7280"
                                                        }}>
                                                            For Review
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Job Offer Stage */}
                                                <div style={{
                                                    minWidth: 240,
                                                    background: "#F9FAFB",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: 12,
                                                    padding: 16,
                                                    flex: "0 0 auto"
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                                        <i className="la la-briefcase" style={{ fontSize: 18, color: "#6B7280" }}></i>
                                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#181D27" }}>Job Offer</span>
                                                    </div>
                                                    <div style={{ marginBottom: 8 }}>
                                                        <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Substages</span>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                        <div style={{
                                                            background: "#fff",
                                                            border: "1px solid #E5E7EB",
                                                            borderRadius: 8,
                                                            padding: "10px 12px",
                                                            fontSize: 13,
                                                            color: "#6B7280"
                                                        }}>
                                                            For Final Review
                                                        </div>
                                                        <div style={{
                                                            background: "#fff",
                                                            border: "1px solid #E5E7EB",
                                                            borderRadius: 8,
                                                            padding: "10px 12px",
                                                            fontSize: 13,
                                                            color: "#6B7280"
                                                        }}>
                                                            Waiting Offer Acceptance
                                                        </div>
                                                        <div style={{
                                                            background: "#fff",
                                                            border: "1px solid #E5E7EB",
                                                            borderRadius: 8,
                                                            padding: "10px 12px",
                                                            fontSize: 13,
                                                            color: "#6B7280"
                                                        }}>
                                                            For Contract Signing
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Additional Details */}
                            <div style={{ flex: "0 0 calc(35% - 24px)", display: "flex", flexDirection: "column", gap: 16 }}>
                                {/* Team Access */}
                                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#181D27", margin: 0 }}>Team Access</h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditSection("Career Details & Team Access");
                                                setShowEditModal(true);
                                            }}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: 4
                                            }}
                                        >
                                            <i className="la la-pen" style={{ fontSize: 18, color: "#6B7280" }}></i>
                                        </button>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {/* Job Owner */}
                                        {formData.createdBy && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "50%",
                                                    background: "#E5E7EB",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: "#374151"
                                                }}>
                                                    {formData.createdBy.name ? formData.createdBy.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "??"}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 14, color: "#181D27", fontWeight: 500 }}>
                                                        {formData.createdBy.name || formData.createdBy.email} {formData.createdBy.email === user?.email && "(You)"}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "#6B7280" }}>{formData.createdBy.email}</div>
                                                </div>
                                                <div style={{ fontSize: 14, color: "#6B7280", fontWeight: 500 }}>
                                                    Job Owner
                                                </div>
                                            </div>
                                        )}
                                        {/* Additional contributors can be added here if available in career data */}
                                        {formData.lastEditedBy && formData.lastEditedBy.email !== formData.createdBy?.email && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "50%",
                                                    background: "#E5E7EB",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: "#374151"
                                                }}>
                                                    {formData.lastEditedBy.name ? formData.lastEditedBy.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "??"}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 14, color: "#181D27", fontWeight: 500 }}>
                                                        {formData.lastEditedBy.name || formData.lastEditedBy.email}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "#6B7280" }}>{formData.lastEditedBy.email}</div>
                                                </div>
                                                <div style={{ fontSize: 14, color: "#6B7280", fontWeight: 500 }}>
                                                    Contributor
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Career Link */}
                                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#181D27", marginBottom: 16 }}>Career Link</h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <input
                                            type="text"
                                            value={`https://www.hellojia.ai/job-portal/${formData._id}`}
                                            readOnly
                                            style={{
                                                flex: 1,
                                                padding: "8px 12px",
                                                fontSize: 14,
                                                border: "1px solid #E5E7EB",
                                                borderRadius: 8,
                                                background: "#F9FAFB",
                                                color: "#6B7280"
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`https://www.hellojia.ai/job-portal/${formData._id}`);
                                            }}
                                            style={{
                                                padding: "8px 12px",
                                                background: "#000",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 8,
                                                cursor: "pointer",
                                                fontSize: 14
                                            }}
                                        >
                                            <i className="la la-copy"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* Direct Interview Link */}
                                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#181D27", marginBottom: 16 }}>Direct Interview Link</h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                        <input
                                            type="text"
                                            value={formData.directInterviewLink || "Not set"}
                                            readOnly
                                            style={{
                                                flex: 1,
                                                padding: "10px 12px",
                                                fontSize: 14,
                                                border: "1px solid #E5E7EB",
                                                borderRadius: 8,
                                                background: "#F9FAFB",
                                                color: "#6B7280"
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(formData.directInterviewLink || "");
                                            }}
                                            style={{
                                                padding: "8px 12px",
                                                background: "transparent",
                                                color: "#6B7280",
                                                border: "1px solid #E5E7EB",
                                                borderRadius: 8,
                                                cursor: "pointer",
                                                fontSize: 14,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            <i className="la la-copy" style={{ fontSize: 18 }}></i>
                                        </button>
                                    </div>
                                    <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
                                        Share the link to an applicant for a direct interview.
                                    </p>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <button
                                            onClick={() => {
                                                if (formData.directInterviewLink) {
                                                    window.open(formData.directInterviewLink, "_blank");
                                                }
                                            }}
                                            disabled={!formData.directInterviewLink}
                                            style={{
                                                flex: 1,
                                                padding: "10px 16px",
                                                background: "#fff",
                                                color: "#181D27",
                                                border: "1px solid #E5E7EB",
                                                borderRadius: 8,
                                                cursor: formData.directInterviewLink ? "pointer" : "not-allowed",
                                                fontSize: 14,
                                                fontWeight: 500,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 8,
                                                opacity: formData.directInterviewLink ? 1 : 0.5
                                            }}
                                        >
                                            <i className="la la-external-link-alt"></i>
                                            Open link
                                        </button>
                                        <button
                                            style={{
                                                flex: 1,
                                                padding: "10px 16px",
                                                background: "#FEF2F2",
                                                color: "#DC2626",
                                                border: "1px solid #FEE2E2",
                                                borderRadius: 8,
                                                cursor: "pointer",
                                                fontSize: 14,
                                                fontWeight: 500,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 8
                                            }}
                                        >
                                            <i className="la la-link-slash"></i>
                                            Disable link
                                        </button>
                                    </div>
                                </div>

                                {/* Advanced Settings */}
                                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#181D27", marginBottom: 16 }}>Advanced Settings</h3>
                                    <button
                                        style={{
                                            width: "100%",
                                            padding: "10px 16px",
                                            background: "#FEE2E2",
                                            color: "#DC2626",
                                            border: "1px solid #FCA5A5",
                                            borderRadius: 8,
                                            cursor: "pointer",
                                            fontSize: 14,
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 8
                                        }}
                                    >
                                        <i className="la la-trash"></i>
                                        Delete this career
                                    </button>
                                    <p style={{ fontSize: 12, color: "#6B7280", marginTop: 8, textAlign: "center" }}>
                                        Be careful, this action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                            )}
                        </>
                    )}
                    {candidateMenuOpen && <CandidateMenu
                        handleCandidateMenuOpen={handleCandidateMenuOpen}
                        candidate={selectedCandidate}
                        handleCandidateCVOpen={handleCandidateCVOpen}
                        handleEndorseCandidate={handleEndorseCandidate}
                        handleDropCandidate={handleDropCandidate}
                        handleCandidateAnalysisComplete={handleCandidateAnalysisComplete}
                        handleRetakeInterview={handleRetakeInterview}
                    />}
                    {candidateCVOpen && <CandidateCV candidate={selectedCandidateCV} setShowCandidateCV={setCandidateCVOpen} />}
                    {droppedCandidatesOpen && <DroppedCandidates handleDroppedCandidatesOpen={setDroppedCandidatesOpen} timelineStage={selectedDroppedCandidates} handleCandidateMenuOpen={handleCandidateMenuOpen} handleCandidateCVOpen={handleCandidateCVOpen} handleReconsiderCandidate={handleReconsiderCandidate} />}
                    {showCandidateHistory && <CandidateHistory candidate={selectedCandidateHistory} setShowCandidateHistory={setShowCandidateHistory} />}
                    {showCandidateActionModal && <CandidateActionModal candidate={selectedCandidate} onAction={handleCandidateAction} action={showCandidateActionModal} />}
                    {showEditModal && (
                        <div
                            className="modal show fade-in-bottom"
                            style={{
                                display: "block",
                                background: "rgba(0,0,0,0.45)",
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100vw",
                                height: "100vh",
                                zIndex: 1050,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "100vh",
                                    width: "100vw",
                                }}
                            >
                                <div
                                    className="modal-content"
                                    style={{
                                        overflowY: "scroll",
                                        height: "100vh",
                                        width: "90vw",
                                        background: "#fff",
                                        border: "1.5px solid #E9EAEB",
                                        borderRadius: 14,
                                        boxShadow: "0 8px 32px rgba(30,32,60,0.18)",
                                        padding: "24px"
                                    }}
                                >
                                    <CareerFormV2
                                        career={formData}
                                        mode="edit"
                                        initialSection={editSection}
                                        onClose={() => setShowEditModal(false)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <Tooltip className="career-fit-tooltip fade-in" id="career-fit-tooltip" />
                </div>
            </div>
        </>
    )
}