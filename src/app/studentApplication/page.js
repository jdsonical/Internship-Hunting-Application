'use client'
import "bootstrap/dist/css/bootstrap.min.css"
import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from "react-bootstrap/Container";
import { Component, useEffect, useState, useRef } from 'react';
import StudentNavbar from "../studentNavbar";
import { Card, Col, Row } from "react-bootstrap";
import '../globals.css'
import DocxExtractor from "./DocxExtractor";
import Modal from 'react-bootstrap/Modal';
import GenerateAnswerButton from "./generateAnswerButton";

function StudentApplication() {
  const [postID, setPostID] = useState(-1);
  const [studentID, setStudentID] = useState(-1);
  const [application, setApplication] = useState({submitted: false, evidences: [], post: {}});
  const [CV, setCV] = useState("")
  const [extractedCV, setExtractedCV] = useState("")
  const [showUploader, setShowUploader] = useState(false);
  const [showJobListing, setJobListing] = useState(false);

  const handleCloseJobListing = () => setJobListing(false);
  const handleShowJobListing = () => setJobListing(true);

  const handleUploaderClose = () => setShowUploader(false);
  const handleUploaderShow = () => setShowUploader(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryStudentID = parseInt(urlParams.get('studentID'));
    const queryPostID = parseInt(urlParams.get('postID'));
    
    if (isNaN(queryStudentID) || isNaN(queryPostID)) window.location.replace("/studentDashboard");
    setStudentID(queryStudentID);
    setPostID(queryPostID);
    
    fetch('/api/studentApplication', {
      method: "POST",
      body: JSON.stringify({
        studentID: queryStudentID,
        postID: queryPostID
      })
    }).then((response) => response.json())
      .then((data) => { setApplication(data);  console.log(data)});
  }, []);

  return (
    <main className="studentApplication">
      <StudentNavbar></StudentNavbar>
      <Container style={{ height: "80vh" }}>
        <Card className="mt-4 h-100">
          <Card.Header className="d-flex justify-content-between">
            
            <Row>
              {application.submitted ? <Col xs={7}><h4>Submitted</h4></Col> : null}
              <Col xs={5}><Button  style={{float: "left"}} variant="primary" onClick={handleShowJobListing}>
                  ViewListing
                </Button>

              <Modal show={showJobListing} onHide={handleCloseJobListing}>
                <Modal.Header closeButton>
                  <Modal.Title>{application.post.name}</Modal.Title>
                </Modal.Header>
                    <Modal.Body>
                      <strong>Description:</strong><br></br>
                      {application.post.description}<br></br><br></br>
                      <strong>Requirements:</strong>
                      {application.evidences.map((evidence, index) => (
                        <p key={index}>- {evidence.requirement.requirementText}</p>
                      ))}
                    </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseJobListing}>
                    Close
                  </Button>
                </Modal.Footer>
            </Modal></Col>
            </Row>
            
            
            
            <h4>{application.post.name}</h4>
            
            <Button variant={(extractedCV != "") ? "success" : "danger"} disabled={application.submitted} onClick={handleUploaderShow}>Upload CV</Button>
            <Modal show={showUploader} onHide={handleUploaderClose}>
              <Modal.Header closeButton>
                <Modal.Title>Upload CV</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>CV must be in (.doc, .docx)</p>
                <p>Uploaded file: {CV.name}</p>
                <DocxExtractor setExtractedCV={setExtractedCV} setCV={setCV}></DocxExtractor></Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleUploaderClose}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </Card.Header>

          <Form>
            <EvidenceEntryList extractedCV={extractedCV} application={application} postID={postID} studentID={studentID}/>
          </Form>
        </Card>
      </Container>
    </main>
  );
}

export default StudentApplication;

class EvidenceEntryList extends Component {
  constructor(props) {
    super(props);
    this.changeEntryValues.bind(this);
    this.state = {
      extractedCV: props.extractedCV,
      evidences: props.application.evidences,
      entryValues: props.application.evidences.map((evidence) => evidence.evidenceText)
    }
  }
  handleAutoSave = () => {
    this.state.evidences.forEach((evidence, i) => {
      fetch("/api/studentApplication", {
        method: "PUT",
        body: JSON.stringify({
          studentID: this.props.studentID,
          postID: this.props.postID,
          requirementID: evidence.requirementID,
          evidenceText: this.state.entryValues[i]
        })
      })
    });
  }

  handleSubmitApplication = () => {
      fetch("/api/submitApplication", {
        method: "PUT",
        body: JSON.stringify({
          studentID: this.props.studentID,
          postID: this.props.postID,
        })
      });
      window.location.reload(false);
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      this.setState({
        extractedCV: this.props.extractedCV,
        evidences: this.props.application.evidences,
        entryValues: this.props.application.evidences.map((evidence) => evidence.evidenceText)
      });
    }
  }

  // Change by text input
  updateEntryValue(i, value) {
    const updatedEntryValues = [...this.state.entryValues];
    updatedEntryValues[i] = value;
    this.setState({ entryValues: updatedEntryValues }, () => {this.handleAutoSave();});
  }

  // Change by generateAnswerButton component
  changeEntryValues = (newValue) => {
    this.setState({ entryValues: newValue }, () => {this.handleAutoSave();});
  };

  render() {
    return (
      <div className="evidenceEntryList">
        <Accordion defaultActiveKey={['0']} alwaysOpen>{
          this.state.evidences.map((evidence, i) => {
            return (
              <Accordion.Item eventKey={i} key={i}>
                <Accordion.Header>{evidence.requirement.requirementText}</Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3" controlId={"formGroupEvidence" + i}>
                  <Form.Control
                    as="textarea"
                    disabled={this.props.application.submitted}
                    rows={3}
                    placeholder="Enter your evidence of the skill"
                    defaultValue={evidence.evidenceText}
                    value={this.state.entryValues[i]}
                    onChange={(event) => {
                      this.updateEntryValue(i, event.target.value)
                    }}
                  />
                  </Form.Group>
                  <GenerateAnswerButton
                    submitted={this.props.application.submitted}
                    jobName = {this.props.application.post.name}
                    extractedCV={this.state.extractedCV}
                    requirement = {evidence.requirement.requirementText}
                    evidence={i}
                    entryValues={this.state.entryValues} 
                    changeEntryValues={this.changeEntryValues} />
                </Accordion.Body>
              </Accordion.Item>
            );
          })
        }
        </Accordion>
        <Button className = {this.props.application.submitted? "invisible" : "visible"} variant="primary" onClick={this.handleSubmitApplication}>
          Submit application
        </Button>
      </div>
    );
  }
}
