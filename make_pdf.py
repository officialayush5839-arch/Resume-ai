from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font('Arial', 'B', 16)
pdf.cell(40, 10, 'John Doe')
pdf.ln(10)
pdf.set_font('Arial', '', 12)
pdf.cell(40, 10, 'john.doe.123456@vupune.ac.in')
pdf.ln(10)
pdf.cell(40, 10, 'Experience: 5 years at Google. Skills: Python, React, SQL.')
pdf.output('test_resume.pdf', 'F')
