// Selectors for elements
const domain = document.querySelector('#domain').value;
const datepicker = document.querySelector('#datepicker');
const firstSlide = document.querySelector('.first_slide');
const secondSlide = document.querySelector('.second_slide');
const thirdSlide = document.querySelector('.third_slide');
const fourthSlide = document.querySelector('.fourth_slide');
const fifthSlide = document.querySelector('.fifth_slide');
let contactObjectRecordID = document.getElementById("contactObjectRecordID");
const firstSlideNextBtn = document.querySelector('.first_slide_btn');
const paginationButtons = document.querySelector('.pagination-wp');
const errorMessageOTP = document.getElementById('otperrormessage');
console.log("id ", contactObjectRecordID.value);

// Event listener for first slide next button
firstSlideNextBtn.addEventListener('click', () => {
    firstSlide.classList.remove('active');
    secondSlide.classList.add('active');
});

// Event listener for window messages
window.addEventListener('message', event => {
    if (event.data.type === 'hsFormCallback' && event.data.eventName === 'onFormSubmitted') {
        event.preventDefault();
        const email = event.data.data.submissionValues.email;

        setTimeout(() => {
            fetch("https://www-activesgcircle-gov-sg.sandbox.hs-sites.com/_hcms/api/accesssorUserVerification", {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })
            .then(response => response.json())
            .then(data => {
                contactObjectRecordID.value = data.UserID;
                const { verifyUser, label } = data;

                secondSlide.classList.remove('active');
                thirdSlide.classList.add('active');
                document.getElementById(label).classList.add('active');
                console.log("update ", contactObjectRecordID.value);

                // Timer function
                function startTimer(secs) {
                    let timeInSecs = parseInt(secs);
                    const ticker = setInterval(() => {
                        if (timeInSecs > 0) {
                            timeInSecs--;
                        } else {
                            clearInterval(ticker);
                            location.reload();
                        }
                        const mins = Math.floor(timeInSecs / 60);
                        const secsRemainder = timeInSecs % 60;
                        const pretty = `${mins < 10 ? "0" : ""}${mins}:${secsRemainder < 10 ? "0" : ""}${secsRemainder}`;
                        document.getElementById("countdown").innerHTML = pretty;
                    }, 1000);
                }
                
                startTimer(5 * 60);
            })
            .catch(console.error);
        }, 1500);
    }
});

// Initialize date picker
flatpickr(datepicker, {
    dateFormat: "d M Y",
    onChange: (selectedDates, dateStr, instance) => {
        const d = new Date(selectedDates);
        console.log(d);
        const unixTime = d.getTime();
        const path = `${domain}?date=${unixTime}`;
        getContent(path);
    }
});

// Fetch content based on path
function getContent(path) {
    document.getElementById('loading').style.display = "block";
    document.querySelector('.table-wrapper .tbody').innerHTML = '';
    document.querySelector('.table-wrapper .pagination').innerHTML = '';

    fetch(path)
        .then(res => res.text())
        .then(data => {
            const parser = new DOMParser();
            const dom = parser.parseFromString(data, "text/html");
            const content = dom.querySelector('.table-wrapper .tbody').innerHTML;
            const pagination = dom.querySelector('.table-wrapper .pagination').innerHTML;

            if (content.trim().length === 0) {
                document.querySelector('.table-wrapper .tbody').insertAdjacentHTML("beforeend", '<tr><td colspan="5"><h3 style="text-align:center;width: 100%;">No records are found</h3></td></tr>');
            } else {
                document.querySelector('.table-wrapper .tbody').insertAdjacentHTML("beforeend", content);
                document.querySelector('.table-wrapper .pagination').insertAdjacentHTML("beforeend", pagination);
            }
            document.getElementById('loading').style.display = "none";
        })
        .catch(console.error);
}

// Event listener for pagination
$(".pagination").on("click", "a", event => {
    event.preventDefault();
    const path = $(event.target).attr('href');
    getContent(path);
});

// Event listener for table interactions
document.querySelector('.table-wrapper .table').addEventListener("click", event => {
    if (event.target.classList.contains('bookButton')) {
        const getID = event.target.getAttribute('id');
        const assessmentObjectRecordID = event.target.getAttribute('data-objectid');
        const contactObjectRecordIDValue = contactObjectRecordID.value;

        fetch("https://www-activesgcircle-gov-sg.sandbox.hs-sites.com/_hcms/api/createAssessmentAssociation", {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assessmentObjectRecordID, contactObjectRecordIDValue })
        })
        .then(response => response.json())
        .then(data => {
            const label = data.association.labels[0];
            if (label !== "alreadyBooked") {
                const { location, stage, time_of_assessment, date_of_assessment } = data;
                document.querySelectorAll('.locationContent').forEach(item => item.innerHTML = location);
                document.querySelectorAll('.stageContent').forEach(item => item.textContent = stage);
                document.querySelectorAll('.timeassessment').forEach(item => item.innerHTML = time_of_assessment);
                document.querySelectorAll('.dateassessment').forEach(item => {
                    const d = new Date(date_of_assessment);
                    item.innerHTML = d.toDateString();
                });
            }
            fifthSlide.classList.add('active');
            fourthSlide.classList.remove('active');
            document.getElementById(label).classList.add('active');
        })
        .catch(console.error);
    }
});

// Event listener for OTP form submission
const confirmOTPForm = document.getElementById('confirmOTPform');
if (confirmOTPForm) {
    confirmOTPForm.addEventListener('submit', event => {
        event.preventDefault();
        const otpValue = document.getElementById("otpinput").value;
        const contactObjectRecordIDValue = contactObjectRecordID.value;

        if (!otpValue.trim()) {
            errorMessageOTP.style.display = "block";
        } else {
            fetch("https://www-activesgcircle-gov-sg.sandbox.hs-sites.com/_hcms/api/accesssorOTPVerification", {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otpValue, contactObjectRecordIDValue })
            })
            .then(response => response.json())
            .then(data => {
                if (data.verified) {
                    thirdSlide.classList.remove('active');
                    fourthSlide.classList.add('active');
                    errorMessageOTP.style.display = "none";
                } else {
                    errorMessageOTP.textContent = "Please enter the correct OTP";
                    errorMessageOTP.style.display = "block";
                }
            })
            .catch(console.error);
        }
    });
}

// Event listener for OTP input focus
document.getElementById("otpinput").addEventListener("focus", () => {
    errorMessageOTP.style.display = "none";
});
