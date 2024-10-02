import * as aws from "@aws-sdk/client-ses";
import nodemailer from "nodemailer";
import { EmailDetails, EmailSender } from "@vendure/email-plugin";

export interface SESOptions {
  access_key_id: string;
  secret_access_key: string;
  region: string;

  from: string;
  order_placed_cc?: string;
}

export class AwsSesEmailSender implements EmailSender {
  private options_: SESOptions;
  private transporter_: nodemailer.Transporter;

  constructor() {

    this.options_ = {
        access_key_id: process.env.SES_ACCESS_KEY_ID!,
        secret_access_key: process.env.SES_SECRET_ACCESS_KEY!,
        region: process.env.SES_REGION!,
        from: process.env.SES_FROM!,
        order_placed_cc: process.env.SES_ORDER_PLACED_CC, // optional, string containing email address separated by comma
    }

    const ses = new aws.SES({
      region: this.options_.region,
      credentials: {
        accessKeyId: this.options_.access_key_id,
        secretAccessKey: this.options_.secret_access_key,
      },
    });

    this.transporter_ = nodemailer.createTransport({
      SES: { ses, aws },
    });
  }

  async send(email: EmailDetails) {
    let sendOptions: SendOptions = {
      to: email.recipient,
      from: this.options_.from, //  email.from, 
      subject: email.subject,
      html: email.body,
      text: email.body,
    };

    let status;
    await this.transporter_
      .sendMail(sendOptions)
      .then(() => {
        status = "sent";
      })
      .catch((error) => {
        status = "failed";
        console.log(error);
      });

    // TODO: admin CC
    //   if (event === "order.placed" && this.options_.order_placed_cc) {
    //     const recipients = this.options_.order_placed_cc.split(",");
    //     for (let recipient of recipients) {
    //       recipient = recipient.trim();
    //       await this.transporter_.sendMail({
    //         ...sendOptions,
    //         to: recipient,
    //         subject: `[CC] ${sendOptions.subject}`,
    //       });
    //     }
    //   }
  }
}

interface SendOptions {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
}
