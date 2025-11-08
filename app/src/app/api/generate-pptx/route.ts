import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Get JSON data from request
    const jsonData = await request.json();

    // Create temporary file paths
    const timestamp = Date.now();
    const tempDir = '/tmp';
    const tempJsonPath = path.join(tempDir, `presentation-${timestamp}.json`);
    const tempPptxPath = path.join(tempDir, `presentation-${timestamp}.pptx`);

    // Write JSON to temporary file
    await writeFile(tempJsonPath, JSON.stringify(jsonData, null, 2));

    // Get the path to the Python script (in parent directory)
    const pythonScript = path.join(process.cwd(), '..', 'pptx-generator.py');

    try {
      // Execute Python script
      const { stdout, stderr } = await execPromise(
        `python3 "${pythonScript}" "${tempJsonPath}" "${tempPptxPath}"`,
        { timeout: 30000 } // 30 second timeout
      );

      if (stderr && !stderr.includes('DeprecationWarning')) {
        console.error('Python script stderr:', stderr);
      }

      // Check if PPTX file was created
      const pptxBuffer = await readFile(tempPptxPath);

      // Clean up temp files
      await unlink(tempJsonPath).catch(console.error);
      await unlink(tempPptxPath).catch(console.error);

      // Return PPTX file
      return new NextResponse(pptxBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': 'attachment; filename="presentation.pptx"',
        },
      });
    } catch (execError: any) {
      // Clean up temp files on error
      await unlink(tempJsonPath).catch(console.error);
      await unlink(tempPptxPath).catch(console.error);

      console.error('Error executing Python script:', execError);
      return NextResponse.json(
        {
          error: 'Failed to generate PPTX',
          details: execError.message,
          hint: 'Make sure Python 3 and python-pptx are installed'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in generate-pptx API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
