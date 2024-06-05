const { google } = require("googleapis");
const Event = require("../models/Event");
const axios = require("axios");

const oauth2Client = new google.auth.OAuth2(
  "1019918519182-bb74on44ac9gg4faq9rsml1tm3gn22pp.apps.googleusercontent.com",
  "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",
  "https://event-server-dp.onrender.com/api/events/oauth2callback"
);

async function AuthCallback(req, res) {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log("1");
    const userInfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    console.log("2");
    const userInfo = userInfoResponse.data;
    console.log(userInfo);

    // Construct redirect URL with user details
    const redirectUrl = `https://event-app-durgaprasad-2002s-projects.vercel.app/login?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}&scope=${tokens.scope}&token_type=${tokens.token_type}&expiry_date=${tokens.expiry_date}&email=${userInfo.email}&name=${userInfo.name}&gid=${userInfo.id}`;

    res.redirect(redirectUrl);
  } catch (err) {
    console.log(err);
    const error = "Failed to exchange tokens";
    res.redirect(`http://localhost:3000/login?error=${error}`);
  }
}

async function GetAllEvents(req, res) {
  try {
    const { id, date } = req.query;
    const newDate = new Date(date);
    const events = await Event.find({
      userId: id,
      date: newDate,
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function convertTimeTo24HourFormat(timeString) {
  console.log(timeString);
  // Split the time string into hours, minutes, and AM/PM parts
  const [timePart, ampmPart] = timeString.split(" ");

  // Split the hours and minutes
  const [hours, minutes] = timePart.split(":").map((part) => parseInt(part));

  // Convert to 24-hour format
  let hours24 = hours;
  if (ampmPart === "PM" && hours !== 12) {
    hours24 += 12;
  } else if (ampmPart === "AM" && hours === 12) {
    hours24 = 0;
  }

  // Format hours, minutes, and seconds to ensure they are two digits
  const formattedHours = String(hours24).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = "00";

  // Construct the 24-hour format time string
  const timeIn24HourFormat = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

  console.log(timeIn24HourFormat);

  return timeIn24HourFormat;
}

function convertTimeTo24HourFormatMethods(timeString) {
  console.log(timeString);

  const [timePart, ampmPart] = timeString.split(" ");

  // Split the hours and minutes
  const [hours, minutes] = timePart.split(":").map((part) => parseInt(part));

  // Convert to 24-hour format
  let hours24 = hours;

  if (ampmPart == "PM" && hours != 12) {
    hours24 += 12;
  }

  // Format hours, minutes, and seconds to ensure they are two digits
  const formattedHours = String(hours24).padStart(2, "0");
  const formattedMinutes = "00";
  const formattedSeconds = "00";

  // Construct the 24-hour format time string
  const timeIn24HourFormat = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

  console.log(timeIn24HourFormat);

  return timeIn24HourFormat;
}

async function CreateEvent(req, res) {
  try {
    const {
      title,
      description,
      participants,
      date,
      time,
      endTime,
      sessionNotes,
      userId,
    } = req.body;

    const converted = convertTimeTo24HourFormat(time);
    const convertedEndTime = convertTimeTo24HourFormat(endTime);

    // Sync with Google Calendar
    let googleEventId = null;
    if (req.body.googleToken) {
      oauth2Client.setCredentials({ access_token: req.body.googleToken });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const ModifiedStart = new Date(date + "T" + converted);
      const ModifiedEnd = new Date(date + "T" + convertedEndTime);

      const googleEvent = {
        summary: title,
        description,
        start: { dateTime: ModifiedStart.toISOString() },
        end: { dateTime: ModifiedEnd.toISOString() },
        attendees: participants.map((email) => ({ email })),
      };

      const createdEvent = await calendar.events.insert({
        calendarId: "primary",
        resource: googleEvent,
      });

      googleEventId = createdEvent.data.id;
    }

    const newEvent = new Event({
      title,
      description,
      participants,
      date,
      startTime: converted,
      endTime: convertedEndTime,
      sessionNotes,
      userId,
      googleEventId,
    });

    const event = await newEvent.save();

    res.json(event);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
}

async function UpdateEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const {
      title,
      description,
      participants,
      date,
      startTime,
      endTime,
      sessionNotes,
      googleToken,
    } = req.body;

    event.title = title || event.title;
    event.description = description || event.description;
    event.participants = participants || event.participants;
    event.date = date;
    event.startTime =
      convertTimeTo24HourFormatMethods(startTime) || event.startTime;
    event.endTime = convertTimeTo24HourFormatMethods(endTime) || event.endTime;
    event.sessionNotes = sessionNotes || event.sessionNotes;

    if (googleToken && event.googleEventId) {
      oauth2Client.setCredentials({ access_token: googleToken });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: new Date(date + "T" + event.startTime).toISOString(),
        },
        end: {
          dateTime: new Date(date + "T" + event.endTime).toISOString(),
        },
        attendees: event.participants.map((email) => ({ email })),
      };

      await calendar.events.update({
        calendarId: "primary",
        eventId: event.googleEventId,
        resource: googleEvent,
      });
    }

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function DeleteEvent(req, res) {
  try {
    console.log(req.query);
    const event = await Event.findById(req.query.id);
    console.log(event);

    if (!event) return res.status(404).json({ error: "Event not found" });

    if (req.query.googleToken && event.googleEventId) {
      oauth2Client.setCredentials({ access_token: req.query.googleToken });
      console.log("1");
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      console.log("2");
      await calendar.events.delete({
        calendarId: "primary",
        eventId: event.googleEventId,
      });
      console.log("3");
    }

    await Event.findByIdAndDelete(req.query.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  GetAllEvents,
  CreateEvent,
  UpdateEvent,
  DeleteEvent,
  AuthCallback,
};
