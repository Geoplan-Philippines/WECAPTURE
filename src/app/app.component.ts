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
  public timer_count: number = 1;
  public timer_label: number | string = 'Ready...';
  public selected_pose = 3;
  public captured_photos:any = []

  public canvas_bg = new Image()
  public canvas_logo = new Image()
  public canvas_engine_1 = new Image()
  public canvas_engine_2 = new Image()
  public canvas_headline = new Image()
  public canvas_subheadline = new Image()
  public canvas_subheadline_date = new Image()
  public canvas_footer = new Image()




  constructor(){
    this.canvas_bg.src = '../assets/Polygon Texture background.svg'
    this.canvas_logo.src  = '../assets/Geoplan x IoT Con.svg'
    this.canvas_engine_1.src = '../assets/Gear - Left.svg'
    this.canvas_engine_2.src = '../assets/Gears - Right.svg'
    this.canvas_headline.src = '../assets/Resilience for All.svg'
    this.canvas_subheadline.src = '../assets/Day One.svg'
    this.canvas_subheadline_date.src = '../assets/Day one -Date.svg'
    this.canvas_footer.src = '../assets/Footer.svg'

  }


  start_capturing(){
    this.show_instruction = false
    this.isCameraOn = true
    this.init_camera()
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
        this.timer_count = 1;
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
      this.show_generated_picture = false
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
    ctx_native.height = ctx_height + scaled_height;

    if (ctx) {

      ctx.drawImage(this.canvas_bg, 0,0,this.canvas_bg.width / 6, this.canvas_bg.height / 6)
      ctx.drawImage(this.canvas_logo, 18, ctx_height - 50,this.canvas_logo.width / 2.3, this.canvas_logo.height / 2.3)
      ctx.globalAlpha = 0.5
      ctx.drawImage(this.canvas_engine_1, -80, ctx_height + 10,this.canvas_engine_1.width / 8, this.canvas_engine_1.height / 8)
      ctx.globalAlpha = 0.5
      ctx.drawImage(this.canvas_engine_2, 190, ctx_height + 20,this.canvas_engine_2.width / 9, this.canvas_engine_2.height / 9)
      ctx.globalAlpha = 1
      ctx.drawImage(this.canvas_headline, 28, ctx_height - 10,this.canvas_headline.width / 4.5, this.canvas_headline.height / 4.5)
      ctx.drawImage(this.canvas_subheadline, 40, ctx_height + 10,this.canvas_subheadline.width / 6, this.canvas_subheadline.height / 6)
      ctx.drawImage(this.canvas_subheadline_date, 90, ctx_height + 80,this.canvas_subheadline_date.width / 13, this.canvas_subheadline_date.height / 13)
      ctx.drawImage(this.canvas_footer, 0, (ctx_height + scaled_height) -18,ctx_native.width, this.canvas_footer.height / 5)
      
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
