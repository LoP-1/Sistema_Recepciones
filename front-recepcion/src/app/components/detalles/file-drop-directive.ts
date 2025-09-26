import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[fileDrop]'
})
export class FileDropDirective {

  @Output() fileDropped = new EventEmitter<FileList>();
  @HostBinding('class.file-over') isOver = false;

  @HostListener('dragover', ['$event'])
  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    if (!this.isOver) this.isOver = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.isOver = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.isOver = false;
    if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length) {
      this.fileDropped.emit(ev.dataTransfer.files);
    }
  }
}