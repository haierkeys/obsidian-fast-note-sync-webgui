import { cn } from "@/lib/utils";


interface LogoProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className={cn("size-8", className)}
            {...props}
        >
            <rect
                width="512"
                height="512"
                rx="100"
                className="fill-primary transition-colors duration-300"
            />
            <text
                x="50%"
                y="54%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                fontSize="280"
                className="fill-primary-foreground transition-colors duration-300"
            >
                OS
            </text>
        </svg>
    );
}
