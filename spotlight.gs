// Configuration
//Note - this is the catch-up script used to bring your inbox up to current with labeling.  A separate tool is used to provide ongoing coverage.  Be sure to change the Domain and emojis or tags to whatever you want.
const BATCH_SIZE = 100;
const DOMAIN = 'DOMAIN.com'; //Enter Your Domain Here
const INTERVAL_MINUTES = 10;
const LABEL_NAME = '📌';
const USER_EMAIL = Session.getActiveUser().getEmail(); // Get the executing user's email address

const USE_RETURN_PATH_MISMATCH_LABEL = true; // set to false if you don't want to use this label.  I use this tag to find emails that are likely promotional.
const RETURN_PATH_MISMATCH_LABEL = '`';

const USE_REVIEWED_LABEL_NAME = true; // set to false if you don't want to use this label.  I strongly advise against turning this one off as it is used to confirm that an email was processed.  You can just delete the label when the entire script finishes in a few days.
const REVIEWED_LABEL_NAME = '-';

const USE_DOMAIN_RECIPIENT_LABEL = true; // set to false if you don't want to use this label.  I use it to find emails that are not promotional, but are also not essential to see because another member of my workspace is a recipient.
const DOMAIN_RECIPIENT_LABEL = '--';

const USE_API_TO_HIDE_LABELS = true; // Set to false if you don't want to setup an API to hide labels --https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid



function setup()
{
    Logger.log('Starting setup...');

    try
    {
        if (!GmailApp.getUserLabelByName(LABEL_NAME))
        {
            GmailApp.createLabel(LABEL_NAME);
        }

        ScriptApp.newTrigger('processEmails')
            .timeBased()
            .everyMinutes(INTERVAL_MINUTES)
            .create();

        Logger.log('Time-trigger setup successfully.');
    }
    catch (error)
    {
        Logger.log('Error setting up time-trigger: ' + error.toString());
    }
}

function processEmails()
{
    Logger.log('Processing emails...');

    try
    {
        const label = GmailApp.getUserLabelByName(LABEL_NAME) || GmailApp.createLabel(LABEL_NAME);

        let reviewedLabel, returnPathMismatchLabel, domainRecipientLabel;

        if (USE_REVIEWED_LABEL_NAME)
        {
            reviewedLabel = GmailApp.getUserLabelByName(REVIEWED_LABEL_NAME) || GmailApp.createLabel(REVIEWED_LABEL_NAME);
            if (USE_API_TO_HIDE_LABELS) hideLabel(REVIEWED_LABEL_NAME);
        }

        if (USE_RETURN_PATH_MISMATCH_LABEL)
        {
            returnPathMismatchLabel = GmailApp.getUserLabelByName(RETURN_PATH_MISMATCH_LABEL) || GmailApp.createLabel(RETURN_PATH_MISMATCH_LABEL);
            if (USE_API_TO_HIDE_LABELS) hideLabel(RETURN_PATH_MISMATCH_LABEL);
        }

        if (USE_DOMAIN_RECIPIENT_LABEL)
        {
            domainRecipientLabel = GmailApp.getUserLabelByName(DOMAIN_RECIPIENT_LABEL) || GmailApp.createLabel(DOMAIN_RECIPIENT_LABEL);
            if (USE_API_TO_HIDE_LABELS) hideLabel(DOMAIN_RECIPIENT_LABEL);
        }

        let query = `newer_than:365d to:${USER_EMAIL} -label:${LABEL_NAME} in:inbox`;
        if (USE_REVIEWED_LABEL_NAME)
        {
            query += ` -label:${REVIEWED_LABEL_NAME}`;
        }
        if (USE_RETURN_PATH_MISMATCH_LABEL)
        {
            query += ` -label:${RETURN_PATH_MISMATCH_LABEL}`;
        }
        if (USE_DOMAIN_RECIPIENT_LABEL)
        {
            query += ` -label:${DOMAIN_RECIPIENT_LABEL}`;
        }

        Logger.log(`Search query used: ${query}`);

        let threads = GmailApp.search(query, 0, BATCH_SIZE);
        let totalThreads = threads.length;

        Logger.log(`Total threads fetched: ${totalThreads}`);

        threads.forEach(thread =>
        {
            let messages = thread.getMessages();
            messages.forEach(message =>
            {
                let toAddresses = message.getTo();
                let ccAddresses = message.getCc() || "";

                Logger.log(`Processing email with subject: ${message.getSubject()}, To: ${toAddresses}, CC: ${ccAddresses}`);

                let isValid = isValidMessage(message, DOMAIN);

                if (isValid === true)
                {
                    label.addToThread(thread);
                    Logger.log(`Labeled message with subject: ${message.getSubject()}`);
                }
                else
                {
                    if (USE_RETURN_PATH_MISMATCH_LABEL && isValid === "From address is not the same as Return-Path")
                    {
                        returnPathMismatchLabel.addToThread(thread);
                        Logger.log(`Message with subject: ${message.getSubject()} had a mismatch between From and Return-Path.`);
                    }
                    else if (USE_REVIEWED_LABEL_NAME)
                    {
                        reviewedLabel.addToThread(thread);
                        Logger.log(`Message with subject: ${message.getSubject()} was excluded because: ${isValid}`);
                    }
                    else if (USE_DOMAIN_RECIPIENT_LABEL && isValid === "Another email address in the same domain appears in the To or CC field")
                    {
                        domainRecipientLabel.addToThread(thread);
                        Logger.log(`Message with subject: ${message.getSubject()} had another recipient from the same domain.`);
                    }
                }
            });
        });

        Logger.log('Finished processing emails.');
    }
    catch (error)
    {
        Logger.log('Error processing emails: ' + error.toString());
    }
}



function isValidMessage(message, domain)
{
    let fullFromAddress = message.getFrom();
    let fromAddressRegex = /<([^>]+)>/;
    let match = fromAddressRegex.exec(fullFromAddress);
    let fromAddress = match ? match[1].toLowerCase() : fullFromAddress.toLowerCase();

    let toAddresses = message.getTo().split(',');
    let ccAddresses = message.getCc() ? message.getCc().split(',') : [];
    let body = message.getPlainBody().toLowerCase();
    let headers = message.getHeader('Return-Path');
    let returnPathAddress;

    if (headers)
    {
        returnPathAddress = headers.toLowerCase().replace(/<|>/g, '');
    }
    else
    {
        Logger.log(`No Return-Path header for email with subject: ${message.getSubject()}. Setting Return-Path to From address for comparison.`);
        returnPathAddress = fromAddress; // Set returnPathAddress to fromAddress for comparison.
    }

    Logger.log(`Comparing From: ${fromAddress} to Return-Path: ${returnPathAddress}`);

    if (fromAddress !== returnPathAddress) return "From address is not the same as Return-Path";

    if (fromAddress.includes(`@${domain}`))
    {
        let combinedRecipients = toAddresses.concat(ccAddresses);
        let domainRecipientsCount = 0;

        for (let address of combinedRecipients)
        {
            let cleanAddress = (fromAddressRegex.exec(address) || [])[1] || address;
            if (cleanAddress.includes(`@${domain}`)) domainRecipientsCount++;
        }

        if (domainRecipientsCount === 1 && toAddresses.includes(USER_EMAIL))
        {
            return true; // Email will be labeled with LABEL_NAME
        }
        else
        {
            return "Another email address in the same domain appears in the To or CC field";
        }
    }

    if (fromAddress.includes(`noreply@${domain}`) || fromAddress.includes(`no.reply@${domain}`) || fromAddress.includes(`no-reply@${domain}`))
        return "Message sender is in the same domain or contains 'noreply'";

    const unwantedPhrases = ["unsubscribe", "opt-out", "view in browser", "view as a web page", "privacy policy", "click here", "view online", "update your preferences", "manage your account", "noreply"];
    let htmlBody = message.getBody().toLowerCase();

    for (let phrase of unwantedPhrases)
    {
        if (body.includes(phrase) || htmlBody.includes(phrase))
        {
            return `Message contains the term: ${phrase}`;
        }
    }

    for (let address of toAddresses.concat(ccAddresses))
    {
        let cleanAddress = (fromAddressRegex.exec(address) || [])[1] || address;
        if (cleanAddress.includes(`@${domain}`) && cleanAddress !== USER_EMAIL)
        {
            return "Another email address in the same domain appears in the To or CC field";
        }
    }

    return true;
}


function tearDown()
{
    let triggers = ScriptApp.getProjectTriggers();
    for (let trigger of triggers)
    {
        if (trigger.getHandlerFunction() === 'processEmails')
        {
            ScriptApp.deleteTrigger(trigger);
            Logger.log('Time-trigger deleted successfully.');
            break;
        }
    }
}

function hideLabel(labelName)
{
    var labelId;

    // First, get the label ID based on the label name.
    var labels = Gmail.Users.Labels.list('me').labels;
    for (var i = 0; i < labels.length; i++)
    {
        if (labels[i].name == labelName)
        {
            labelId = labels[i].id;
            break;
        }
    }

    if (labelId)
    {
        // Now, update the label to be hidden from the label list.
        Gmail.Users.Labels.update(
        {
            "labelListVisibility": "labelHide",
            "messageListVisibility": "show"
        }, 'me', labelId);
    }
    else
    {
        Logger.log(`Label ${labelName} not found.`);
    }
}

processEmails();
