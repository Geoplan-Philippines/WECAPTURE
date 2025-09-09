import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { flush } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toPng, toJpeg, toBlob, toPixelData, toSvg} from 'html-to-image';
import download from 'downloadjs'
import { RouterLinkActive } from "../../node_modules/@angular/router/router_module.d-Bx9ArA6K";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('main_wrapper_ref') main_wrapper_ref!: ElementRef<HTMLElement>;
  @ViewChild('main_canvas_ref') main_canvas_ref!: ElementRef<HTMLElement>;
  @ViewChild('camera_ref') camera_ref!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas_ref') canvas_ref!: ElementRef<HTMLElement>;
  @ViewChild('half_canvas_ref') half_canvas_ref!: ElementRef<HTMLElement>;


  public isCameraOn: boolean = false;
  public show_timer_label: boolean = false;
  public activate_shutter: boolean = false;
  public show_instruction: boolean = true;
  public is_generating_qr: boolean = true;
  public show_generated_picture: boolean = true;
  public number_of_photos_taken:number = 0;
  public camera_stream!: MediaStream;
  public camera_native!: HTMLVideoElement;
  public ctx_native!: HTMLCanvasElement;
  public timer!: any;
  public timer_count: number = 4;
  public timer_label: number | string = 'Ready...';
  public selected_pose = 3;
  public captured_photos:any = []
  public rendered_qr!: SafeHtml

  public canvas_bg = new Image()
  public canvas_logo = new Image()
  public canvas_engine_1 = new Image()
  public canvas_engine_2 = new Image()
  public canvas_headline = new Image()
  public canvas_subheadline = new Image()
  public canvas_subheadline_date = new Image()
  public canvas_footer = new Image()


  private _http_service = inject(HttpClient)
  private _html_sanitizer = inject(DomSanitizer)

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
      console.log(err.message);
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
      await this.generate_framed_photo()
    }
  }



  async generate_framed_photo() {

    this.isCameraOn = false;
    const ctx_native: HTMLElement = this.canvas_ref.nativeElement
    for(let i = 0; i < this.selected_pose; i++) {
           let scaled_width = this.camera_native.videoWidth / 10;
            let scaled_height = this.camera_native.videoHeight / 10;

            const current_img:HTMLImageElement = this.captured_photos[i]
            current_img.width = scaled_width
            current_img.height = scaled_height

          const half_canvas_ref:HTMLElement = this.half_canvas_ref.nativeElement
          half_canvas_ref.style.width = `${scaled_width + 40}px`
          ctx_native.append(this.captured_photos[i])  

      }

    setTimeout(async () => {     
    const main_cavas_ref:HTMLElement = this.main_canvas_ref.nativeElement
    const data_url = await toPng(main_cavas_ref)
    const ip_address = '172.16.100.147'
    const token = Date.now()
    const qr_svg_data = await firstValueFrom(this._http_service.get(`https://api.tinyqrc.com/v1/qr?data=http://${ip_address}:8081/download-hub/${token}&size=300`, { responseType: 'text' }))
    this.rendered_qr = this._html_sanitizer.bypassSecurityTrustHtml(qr_svg_data);
    this.is_generating_qr = false
    
    await firstValueFrom(this._http_service.post(`http://${ip_address}:8081/save-image`, {
      token: token,
      image: data_url
    }))
      
    }, 1000);
  }
}
