import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { flush } from '@angular/core/testing';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('main_wrapper_ref') main_wrapper_ref!: ElementRef<HTMLElement>;
  @ViewChild('camera_ref') camera_ref!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas_ref') canvas_ref!: ElementRef<HTMLCanvasElement>;

  public isCameraOn: boolean = false;
  public show_timer_label: boolean = false;
  public activate_shutter: boolean = false;
  public show_instruction: boolean = true;
  public show_generated_picture: boolean = true;
  public number_of_photos_taken:number = 0;
  public camera_stream!: MediaStream;
  public camera_native!: HTMLVideoElement;
  public ctx_native!: HTMLCanvasElement;
  public timer!: any;
  public timer_count: number = 4;
  public timer_label: number | string = 'Ready...';
  public selected_pose = 4;
  public captured_photos:any = []

  ngOnInit(): void {
    // this.init_camera();
  }

  async init_camera() {
    try {
        this.camera_stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        this.camera_native = this.camera_ref.nativeElement;

        this.camera_native.onloadedmetadata = () => {
          this.show_timer_label = true;
        };
        this.camera_native.srcObject = this.camera_stream;
      

      for (let i = 0; i < this.selected_pose; i++) {
        this.timer_count = 4;
        setTimeout(() => {
          this.show_timer_label = true;
        }, 500);
        await new Promise((resolve) => {
          this.timer = setInterval(() => {
            this.timer_count -= 1;
            this.timer_label = this.timer_count;
            if (this.timer_count == 0) {
              this.timer_label = 'Ready...'
              this.show_timer_label = false;
              this.activate_shutter = true;
              setTimeout(() => {
                this.activate_shutter = false;
              }, 100);
              clearInterval(this.timer);
              resolve(true);
            }
          }, 1000);
        });
        await this.capture_photo();
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  async capture_photo() {
    let canvas = document.createElement('canvas')
    canvas.width = this.camera_native.videoWidth 
    canvas.height = this.camera_native.videoHeight
    
    const ctx = canvas.getContext('2d');
    let canvasUrl = null
    if(ctx){
      ctx.drawImage(this.camera_native,0,0,canvas.width,canvas.height)
      canvasUrl = canvas.toDataURL('image/png')
    }
    const image = new Image()
    await new Promise<HTMLImageElement>(resolve=>{
      image.onload = () => resolve(image)
      image.src = canvasUrl as string
      
    })

    this.captured_photos.push(image); 
    
    this.number_of_photos_taken += 1
    if(this.number_of_photos_taken === this.selected_pose){
      this.generate_framed_photo()
    }
  }

  generate_framed_photo() {
    this.isCameraOn = false;
    let margin = 20;
    const ctx_native: HTMLCanvasElement = this.canvas_ref.nativeElement;
    const ctx = ctx_native.getContext('2d');

    let scaled_width = this.camera_native.videoWidth / 3;
    let scaled_height = this.camera_native.videoHeight / 3;

    let ctx_width = scaled_width + margin * 2;
    let ctx_height =
      scaled_height * this.selected_pose + margin * (this.selected_pose + 2);

    ctx_native.width = ctx_width;
    ctx_native.height = ctx_height;

    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx_native.height);

      gradient.addColorStop(0, '#041F3C');
      gradient.addColorStop(1, '#0C55A2');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx_native.width, ctx_native.height);

      for (let i = 0; i < this.selected_pose; i++) {
        let x_pos = margin;
        let y_pos = scaled_height * i + margin * (i + 1);
        if (i !== 0) {
          y_pos = y_pos - (margin / 2) * i;
        }
        ctx.drawImage(
          this.captured_photos[i],
          x_pos,
          y_pos,
          scaled_width,
          scaled_height
        );
      }
    }
  }
}
