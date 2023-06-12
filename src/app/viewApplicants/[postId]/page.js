'use client'
import "bootstrap/dist/css/bootstrap.min.css"
import starStyle from './Star.module.css';
import './viewApplicants.css'
import { Accordion, Button, Card, Col, Container, ListGroup, ListGroupItem, Nav, PageItem, Pagination, Row, Modal, Form} from "react-bootstrap";
import { Component, useEffect, useState, useRef} from "react";
import RecruiterNavbar from "../../recruiterNavbar";
import { BsEye, BsEyeSlash, BsSearch, BsSortDown } from 'react-icons/bs';
import { AiFillStar } from 'react-icons/ai'
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import '../../globals.css'
import { useParams, useRouter, notFound } from "next/navigation";

function averageRating(application) {
  if (application.evidences.length == 0) return 0;
  return application.evidences.map(ev => ev.rating).reduce((a, b) => a + b, 0) / application.evidences.length;
}

function ViewApplicants() {
  const [post, setPost] = useState({name: "", applications: [], description: "", requirements: []});
  const [selectedApplicant, setSelectedApplicant] = useState(-1);
  const [showJobListing, setJobListing] = useState(false);

  const handleClose = () => setJobListing(false);
  const handleShow = () => setJobListing(true);

  const params = useParams()
  const postId = params.postId

  useEffect(() => {
    fetch('/api/post/' + postId)
      .then((response) => response.json())
      .then((data) => setPost(data));
  }, []);

  if (post == undefined) {
    notFound();
  }

  return (
    <main className="viewApplicants">
      <RecruiterNavbar></RecruiterNavbar>
      <Container>
        <Nav className="mt-2">
          <Pagination>
            <PageItem href="/recruiterDashboard">
              Back to Dashboard
            </PageItem>
          </Pagination>
        </Nav>
        <Card>
          <Card.Header>
            <Container>
              <Row>
                <Col xs={10}>{post.name}</Col>
                <Col xs={2}><Button style={{float: "right"}} variant="primary" onClick={handleShow}>
                  View Job Listing
                </Button>

              <Modal show={showJobListing} onHide={handleClose}>
                <Modal.Header closeButton>
                  <Modal.Title>{post.name}</Modal.Title>
                </Modal.Header>
                    <Modal.Body>
                      <strong>Description:</strong><br></br>
                      {post.description}<br></br><br></br>
                      <strong>Requirements:</strong>
                      {post.requirements.map((requirement, index) => (
                        <p key={index}>- {requirement.requirementText}</p>
                      ))}
                    </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleClose}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal></Col>
              </Row>
            </Container>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col xs={4}>
                <ApplicantList post={post} setSelectedApplicant={setSelectedApplicant} selectedApplicant={selectedApplicant}/>
              </Col>
              <Col>
                <SkillList post={post} setPost={setPost} selectedApplicant={selectedApplicant}/>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}

export default ViewApplicants;

class ApplicantList extends Component {
  selectApplicant = (n) => () => {this.props.setSelectedApplicant(n);}

  state = {
    applications:  this.props.post.applications.filter(function(application) {return !application.rejected}),
    rejections: this.props.post.applications.filter(function(application) {return application.rejected}),
    // Only show the rejections at first load if everyone is rejected
    rejected: this.props.post.applications.filter(function(application) {return !application.rejected}).length == 0 
      && this.props.post.applications.filter(function(application) {return application.rejected}).length != 0
  };

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      const applications = this.props.post.applications.filter(function(application) {return !application.rejected})
      const rejections = this.props.post.applications.filter(function(application) {return application.rejected})
      this.setState({
        applications: applications,
        rejections: rejections,
        rejected: this.state.rejected
      });
    }
  }

  toggleRejected = () => {
      this.setState({
        rejected: !this.state.rejected
      });
  }

  render() {
    this.state.applications.sort((a, b) => averageRating(b) - averageRating(a));
    this.state.rejections.sort((a, b) => averageRating(b) - averageRating(a));
    let listToShow = this.state.rejected ? this.state.rejections : []
    let icon = this.state.rejected ? <BsEyeSlash color="black" size={30}/> : <BsEye color="black" size={30}/>

    return (
      <Container style={{height: "70vh"}}>
        <Card className="mt-4 h-100">
          <Card.Header className="d-flex justify-content-between">
            <Button className="sortButton" onClick={this.toggleRejected}>
                {icon}
            </Button>
            <h4>Applicants</h4>
            <Button className="searchButton"><BsSearch color="black" size={30}/></Button>
          </Card.Header>
        
          <ListGroup>
            {this.state.applications.map((application) => (this.renderApplicant(application, false)))}
            {listToShow.map((application) => (this.renderApplicant(application, true)))}
          </ListGroup>
        </Card>
      </Container>
    )
  }

  renderApplicant(application, rejected) {
    return <ListGroupItem className={(application.student.id == this.props.selectedApplicant)? "selectedApplicantListItem" : (rejected ? "rejectedApplicantListItem" : "applicantListItem")} key={application.student.name}>
      <Container fluid style={{ cursor: "pointer" }} onClick={this.selectApplicant(application.student.id)}>
        <Row className="applicantListRow">
          <Col sm={9} className="studentNameCol"><p className="text-left studentName">{application.student.name} </p></Col>
          <Col sm={3} className="avgRatingCol"><p className="text-center avgRating">{averageRating(application)}</p><AiFillStar style={{alignContent: "center"}} size={30}  color="#ffc800"/></Col>
        </Row>
      </Container>
    </ListGroupItem>
  }
}

class SkillList extends Component {
  state = { skills: [], name: "", showDocs: false}
  getSelectedStudent = () => this.props.post.applications.filter(
    app => app.student.id == this.props.selectedApplicant)[0];

  handleDocsShow = () => {
    this.setState({ showDocs: true });
  }

  handleDocsClose = () => {
    this.setState({ showDocs: false });
  }

  rejectApplicant = () => {
    fetch('/api/reject', {
      method: 'PUT',
      body: JSON.stringify({
        postID: this.props.post.id,
        studentID: this.props.selectedApplicant
      })
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      this.setState({
        skills: (this.props.selectedApplicant != -1 ? this.getSelectedStudent().evidences : []),
        name: (this.props.selectedApplicant != -1 ? this.getSelectedStudent().student.name + "'s Application" : "")
      });
    }
  }

  render() {
    this.state.skills.sort((a, b) => a.requirement.requirementText >= b.requirement.requirementText ? 1 : -1)
    return (
      <Container style={{height: "70vh"}}>
        <Card className="mt-4 h-100">
          <Card.Header className="d-flex justify-content-between">
          <Button style={{float: "right"}} variant="primary" onClick={this.handleDocsShow}>
                  View Documents
                </Button>

              <Modal className="docModal" show={this.state.showDocs} onHide={this.handleDocsClose} centered>
                <Modal.Header closeButton>
                  <Modal.Title>Documents</Modal.Title>
                </Modal.Header>
              <Modal.Body >
              <Nav variant="tabs" defaultActiveKey="/home">
                <Nav.Item>
                  <Nav.Link eventKey="doc-1">CV</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="doc-2" >Cover Letter</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="doc-3" >Transcript</Nav.Link>
                </Nav.Item>
              </Nav>
                    <iframe src="http://docs.google.com/gview?url=http://infolab.stanford.edu/pub/papers/google.pdf&embedded=true" style={{width: "60vw", height:"30vw"}} frameborder="0"></iframe>
                    </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={this.handleDocsClose}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>
            <h4>{this.state.name}</h4>
            <Button onClick={this.rejectApplicant}>Reject</Button>
          </Card.Header>
          
          <Accordion>{
            this.state.skills.map((skill) => (
              <Accordion.Item eventKey={skill.requirement.requirementText} key={skill.requirement.requirementText}>
                <Accordion.Header>{skill.requirement.requirementText}</Accordion.Header>
                <Accordion.Body>
                  <Card><Card.Body>{skill.evidenceText}</Card.Body></Card>
                  <Card className="ratingCard"><Card.Body style={{ alignSelf: "flex-end" }}>
                    <StarRating 
                      initialRating={skill.rating}
                      post={this.props.post}
                      setPost={this.props.setPost}
                      studentID={this.getSelectedStudent().student.id}
                      requirementID={skill.requirement.id}
                    />
                  </Card.Body></Card>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Card>
      </Container>
    )
  }
}

class StarRating extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rating: props.initialRating,
      hover: props.initialRating,
      showPopUp: new Array(6).fill(false),
      modalShow: false,
      ratingTextList: [props.post.rating1Text,
        props.post.rating2Text,
        props.post.rating3Text,
        props.post.rating4Text,
        props.post.rating5Text]
    };
  }
  
  handleModalShow = () => {
    this.setState({ modalShow: true });
  }

  handleModalClose = () => {
    this.setState({ modalShow: false });
  }

  handleClick(index) {
    const newShow = this.state.showPopUp;
    newShow[index] = !newShow[index];
    this.setState({showPopUp: newShow });
  }

  handleHover(index) {
    const newShow = this.state.showPopUp;
    newShow[index] = true;
    this.setState({showPopUp: newShow });
  }

  handleHoverOut(index) {
    const newShow = this.state.showPopUp;
    newShow[index] = false;
    this.setState({showPopUp: newShow });
  }


  selectRating(n) {
    this.setState({rating: n });

    const newPost = {...this.props.post};
    newPost.applications
      .filter(app => app.student.id == this.props.studentID)
      .flatMap(app => app.evidences)
      .filter(ev => ev.requirement.id == this.props.requirementID)
      .forEach(ev => {ev.rating = n})
    this.props.setPost(newPost);

    fetch('/api/rating', {
      method: 'PUT',
      body: JSON.stringify({
        studentID: this.props.studentID,
        postID: this.props.post.id,
        requirementID: this.props.requirementID,
        rating: n
      })
    });
  }

  updateRatingScheme = (event) => {
    event.preventDefault();
  
    // Create a new array to store the new textarea values
    let newTextareaValues = [];
    
    // Loop through the refs and get the value of each textarea
    for (let i = 0; i < this.state.ratingTextList.length; i++) {
      newTextareaValues.push(this[`textarea_${i}`].value);
    }

    this.setState({ ratingTextList: newTextareaValues })
  
    // Update the state
    fetch('/api/ratingScheme', {
      method: 'PUT',
      body: JSON.stringify({
        postID: this.props.post.id,
        rating1Text: this[`textarea_0`].value,
        rating2Text: this[`textarea_1`].value,
        rating3Text: this[`textarea_2`].value,
        rating4Text: this[`textarea_3`].value,
        rating5Text: this[`textarea_4`].value,
      })
    });

    const newPost = {...this.props.post};
    newPost.rating1Text = this[`textarea_0`].value;
    newPost.rating2Text = this[`textarea_1`].value;
    newPost.rating3Text = this[`textarea_2`].value;
    newPost.rating4Text = this[`textarea_3`].value;
    newPost.rating5Text = this[`textarea_4`].value;
    console.log(newPost);
    this.props.setPost(newPost);
  };


  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      this.setState({ rating: this.props.initialRating, hover: this.props.initialRating, ratingTextList: [this.props.post.rating1Text,
        this.props.post.rating2Text,
        this.props.post.rating3Text,
        this.props.post.rating4Text,
        this.props.post.rating5Text]});
    }
  }

  render = () => {
    return (
      <div className="star-rating">
        {[...Array(5)].map((_, index) => {
            return (
            <button
              type="button"
              key={index + 1}
              className={index + 1 <= (this.state.hover || this.state.rating) ? starStyle.on : starStyle.off}
              onClick={() => this.selectRating(index + 1)}
              onMouseEnter={() => this.setState({hover: index + 1 })}
              onMouseLeave={() => this.setState({hover: this.state.rating })}
              >
              <OverlayTrigger
              trigger="manual"
              show={this.state.showPopUp[index]}
              key={index}
              placement="top"
              overlay={
                <Popover
                  id={`popover-positioned-${index}`}
                  onMouseEnter={() => this.handleHover(index)}
                  onMouseLeave={() => this.handleHoverOut(index)}>
                  <Popover.Header as="h3">
                  <Container fluid>
                    <Row>
                      <Col sm={9} >{`Star Rating - ${index + 1}`} </Col>
                        <Col sm={3} ><Button size="sm" onClick={this.handleModalShow}>Edit</Button></Col>
                    </Row>
                  </Container>
                  </Popover.Header>
                  <Popover.Body>
                    {this.state.ratingTextList[index]}
                  </Popover.Body>
                </Popover>
              }>
                <span><Modal
                  show={this.state.modalShow}
                  onHide={this.handleModalClose}
                  backdrop="static"
                    keyboard={false}
                    centered>
                  <Form onSubmit={this.updateRatingScheme}>
                    <Modal.Header closeButton>
                      <Modal.Title>Edit Rating Scheme</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {this.state.ratingTextList.map((rateSchemeText, rateNum) => {
                        return (<Form.Group className="mb-3" controlId={`rating-${rateNum}`} key={`rating-${rateNum}`}>
                          <Form.Label><strong>Rating {rateNum} Description</strong></Form.Label>
                          <Form.Control contenteditable="true" type="textarea" placeholder="Enter description on this" defaultValue={rateSchemeText} ref={(input) => this[`textarea_${rateNum}`] = input}/>
                        </Form.Group>); })}
                    
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" type="submit" onClick={this.handleModalClose}>Save</Button>
                        <Button variant="secondary" onClick={this.handleModalClose}>Close</Button>
                      </Modal.Footer>
                  </Form>
                </Modal>
                <span className="star">
                
                <AiFillStar size={20}
                  onClick={() => this.handleClick(index)}
                  onMouseEnter={() => this.handleHover(index)}
                    onMouseLeave={() => this.handleHoverOut(index)} />
                  </span>
                </span>
                
              
              </OverlayTrigger>

            </button>
          );}
        )}
      </div>
    );
  }

}
