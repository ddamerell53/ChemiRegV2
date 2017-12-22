# ChemiReg - web-based compound registration platform
# Written in 2017 by David Damerell <david.damerell@sgc.ox.ac.uk>, Brian Marsden <brian.marsden@sgc.ox.ac.uk>
# 
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# Core Python
import smtplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ChemiReg CC0
from chemiregconfig import ChemiRegConfig

class EmailManager(object):
	def __init__(self):
		self.email_address = ChemiRegConfig.get_email_address()
		self.email_hostname = ChemiRegConfig.get_email_hostname()
		self.email_port = ChemiRegConfig.get_email_port()
		self.email_username = ChemiRegConfig.get_email_username()
		self.email_password = ChemiRegConfig.get_email_password()
		
	def send_email(self, to_addr, cc_addresses, subject, html_content, text_content):
		from_addr = self.email_address
		print('Sending email to ' + to_addr)
		server = smtplib.SMTP(self.email_hostname, self.email_port)
		server.ehlo()

		server.starttls()
		server.login(self.email_username, self.email_password)

		msg_root = MIMEMultipart('related')

		msg_root['Subject'] = subject
		msg_root['From'] = from_addr
		msg_root['To'] = to_addr

		email_list = [to_addr]

		if not cc_addresses is None:
			msg_root['Cc'] = ';'.join(cc_addresses)

			email_list += cc_addresses

		msg_root.preamble = 'This is a multi-part message in MIME format.'

		if text_content is None:
			text_content = 'Please view message in a HTML compatible client'

		msg =  MIMEMultipart('alternative')

		part1 = MIMEText(text_content, 'plain')
		msg.attach(part1)

		part2 = MIMEText(html_content, 'html')
		msg.attach(part2)

		msg_root.attach(msg)

		server.sendmail(from_addr, email_list, msg_root.as_string())

		server.quit()
