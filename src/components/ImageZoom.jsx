import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog.jsx'
import { AspectRatio } from '@/components/ui/aspect-ratio.jsx'

function ImageZoom({ src, alt, className, aspectRatio = 16 / 9 }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <img 
          src={src} 
          alt={alt} 
          className={`cursor-pointer transition-all duration-300 hover:scale-105 ${className}`} 
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl zoom-dialog-content">
        <div className="overflow-hidden rounded-lg">
          <AspectRatio ratio={aspectRatio} className="bg-muted">
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-contain"
            />
          </AspectRatio>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImageZoom