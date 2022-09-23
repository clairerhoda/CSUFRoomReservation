
/**
 * This javascript file is responsible for allowing the user to pick an available 
 * reservation time for reserving a study room. This file operates the different 
 * pages that the user goes through such as selecting a number of students that will
 * reserve the room, selecting how long the user will reserve the room for (30 min
 * increments), selecting an available start time, and confirming all the information 
 * previously selected. This file is responsible for grabbing data from the database
 * such as reservation availability status of rooms and data about if a user is 
 * allowed to make the reservation. Along with the GET calls, the last responsiblity
 * of this file is POSTing data to the database after a reservation has been finalized.
 */

const nextButton = document.getElementById("next-btn");
let pageNumber = 1;

const backButton = document.getElementById("back-btn");

const formContents = document.getElementById("form-selection");
const selectionDescription = document.getElementById("selection-description");
const studentCount = document.getElementById("student-amount");
const dateStart = document.getElementById("date-start");
const halfHourIncrements = document.getElementById("half-hour-increm");
const timeStart = document.getElementById("time-start");

function timeConvert(n) {
    var num = n;
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    var mText =  " 30 minutes";
    var hText = rhours + " hours";
    if (rminutes == 0) {
        mText = "";
    } 
    if (rhours == 1) {
        hText = rhours + " hour";
    }
    return hText + mText;
}

backButton.addEventListener("click", (e) => {
    e.preventDefault();
    pageNumber--;

    if (pageNumber == 1) {
        backButton.style.display = "none";
        selectionDescription.textContent = "Select Number of Students (1-14)";
        studentCount.style.display = "flex";
        dateStart.style.display = "none";
    }

    if (pageNumber == 2) {
        selectionDescription.textContent = "Select a Date";
        dateStart.style.display = "flex";
        halfHourIncrements.style.display = "none";
    }

    if (pageNumber == 3) {
        selectionDescription.textContent = "How Long Do You Want to Reserve the Room?";
        halfHourIncrements.style.display = "flex";
        timeStart.style.display = "none";
    }

    if (pageNumber == 4) {
        selectionDescription.textContent = "Select an Available Reservation Start Time";
        timeStart.style.display = "flex";
        document.getElementById("next-btn").textContent = "Next";
    }

})

nextButton.addEventListener("click", (e) => {
    e.preventDefault();
    pageNumber++;
    
    if (dateStart.value == "" && pageNumber == 3) {
        document.getElementById("invalidText").style.display = "flex";
        pageNumber = 2;
    } else {
        document.getElementById("invalidText").style.display = "none";
    }

    if (pageNumber == 2) {
        backButton.style.display = "flex";
        selectionDescription.textContent = "Select a Date";

        document.getElementById("student-amount").style.display = "none";
        dateStart.style.display = "flex";

        var currentDate = new Date();
        var before1Daydate=new Date(currentDate.setDate(currentDate.getDate() - 1));
        dateStart.setAttribute("min", before1Daydate.toISOString().split("T")[0]);
        var twoWeekLimit=new Date(currentDate.setDate(currentDate.getDate() + 14));
        dateStart.setAttribute("max", twoWeekLimit.toISOString().split("T")[0]);   
        
        // TODO: if the min 30 minutes is not available on a date, make the day not selectable
        // this means all available reservations are taken for that day
        
    }


    if (pageNumber == 3) {
        selectionDescription.textContent = "How Long Do You Want to Reserve the Room?";

        dateStart.style.display = "none";
        halfHourIncrements.style.display = "flex";
        
        // TODO: get all possible available 30 min increments from db
        // Options: 30 min, 1 hour, 1 hour 30, 2 hour, 2 hour 30, 3 hour.
        // Note: Times available will remove 3 hours first, 2 hour 30, and so on.
        var minutes = 30;

        if (halfHourIncrements.length == 0) {
            for (var j = 0; j < 6; j++) {
                var option = document.createElement("option");
                if (minutes > 30) {
                    option.text = timeConvert(minutes);
                } else {
                    option.text = minutes + " min";
                }
                option.value = minutes;
                halfHourIncrements.appendChild(option);
                minutes += 30;
            }
        }
    }

    if (pageNumber == 4) {
        selectionDescription.textContent = "Select an Available Reservation Start Time";

        halfHourIncrements.style.display = "none";
        timeStart.style.display = "flex";

        // TOTO: retreive all possible start times in 30 min increments
        // Example: start time can be 9AM or 9:30AM
        // Note: with reserve length in mind, calculate available start times effeciently.
        var sampleTimes = ["9:00 AM", "9:30 AM", "12:00 PM", "12:30 PM", "4:00 PM"];
        if (timeStart.length == 0) {
            for (var j = 0; j < sampleTimes.length; j++) {
                var option = document.createElement("option");
                option.value = sampleTimes[j];
                option.text = sampleTimes[j];
                timeStart.appendChild(option);
            }
        }         
    }

    if (pageNumber == 5) {
        timeStart.style.display = "none";

        var parts = dateStart.value.split('-');
        var mydate = new Date(parts[0], parts[1] - 1, parts[2]);
        var dateFormatted = (mydate.toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"long", day:"numeric"}) );
        selectionDescription.textContent = "You want to reserve a room for " + dateFormatted + " at " + timeStart.value + " for " + timeConvert(halfHourIncrements.value) + "?";
        document.getElementById("next-btn").textContent = "Confirm";
    }

    if (pageNumber == 6) {
        backButton.style.display = "none";

        var parts = dateStart.value.split('-');
        var mydate = new Date(parts[0], parts[1] - 1, parts[2]);
        var dateFormatted = (mydate.toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"long", day:"numeric"}) );
        var room = "SAMPLE123"; //connect to db
        selectionDescription.textContent = "You have successfully reserved a room on " + dateFormatted + " at " + timeStart.value + " for " + timeConvert(halfHourIncrements.value) + ". \n Your room is located at " + room;

        document.getElementById("next-btn").textContent = "Finish";
    }

    if (pageNumber == 7) {
        location.reload();
        location.href='home.html';
    }

})