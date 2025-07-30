// import { render, screen } from '@testing-library/react';
// import React from 'react';
// import { adaptBackendNodes } from '../../../../utils/apiAdapters';
// import SmartIcon from '../../components/SmartIcon';
// // import { useThemeContext } from '../../../../contexts/ThemeContext';
// import { DiagramStyleProvider } from '../../contexts/DiagramStyleContext';
// // import { beforeEach } from 'node:test';

// // Mock the custom.ts module
// jest.mock('../../../../iconify/custom', () => {
//   return {
//     __esModule: true,
//   };
// });

// // Mock the iconify react component
// jest.mock('@iconify/react', () => ({
//   Icon: ({ icon }: { icon: string }) => (
//     <div data-testid={`iconify-${icon}`}>
//       {icon}
//     </div>
//   ),
//   addCollection: jest.fn(),
// }));

// // Mock the theme context
// jest.mock('../../../../contexts/ThemeContext', () => ({
//   useThemeContext: jest.fn(),
// }));

// // Mock sample backend node response with cloud resources
// const mockBackendNodes = [
//   {
//     id: "client",
//     name: "Web Client",
//     kind: "CLIENT",
//     layer: "CLIENT",
//     metadata: {
//       iconifyId: "mdi:devices",
//       layerIndex: 0
//     }
//   },
//   {
//     id: "aws-lambda",
//     name: "AWS Lambda Function",
//     kind: "COMPUTE",
//     layer: "COMPUTE",
//     metadata: {
//       iconifyId: "custom:aws-lambda",
//       layerIndex: 5,
//       provider: "aws",
//       service: "lambda",
//       category: "compute",
//       cloud: true
//     }
//   },
//   {
//     id: "aws-dynamodb",
//     name: "DynamoDB Table",
//     kind: "DATA",
//     layer: "DATA",
//     metadata: {
//       iconifyId: "custom:aws-dynamodb",
//       layerIndex: 6,
//       provider: "aws",
//       service: "dynamodb",
//       category: "database",
//       cloud: true
//     }
//   },
//   {
//     id: "azure-functions",
//     name: "Azure Functions",
//     kind: "COMPUTE",
//     layer: "COMPUTE",
//     metadata: {
//       iconifyId: "custom:azure-functions",
//       layerIndex: 5,
//       provider: "azure",
//       service: "functions",
//       category: "compute",
//       cloud: true
//     }
//   }
// ];

// // Setup for tests
// beforeEach(() => {
//   // Mock the theme context
//   (useThemeContext as jest.Mock).mockReturnValue({
//     theme: 'light',
//     setTheme: jest.fn()
//   });
// });

// describe('Cloud Icon Renderer', () => {
//   test('adapts backend cloud nodes correctly', () => {
//     // Adapt the backend nodes to frontend format
//     const adaptedNodes = adaptBackendNodes(mockBackendNodes);
    
//     // Verify AWS Lambda node
//     const lambdaNode = adaptedNodes.find(node => node.id === 'aws-lambda');
//     expect(lambdaNode).toBeDefined();
//     expect(lambdaNode?.data.iconifyId).toBe('custom:aws-lambda');
//     expect(lambdaNode?.data.provider).toBe('aws');
    
//     // Verify Azure Functions node
//     const azureNode = adaptedNodes.find(node => node.id === 'azure-functions');
//     expect(azureNode).toBeDefined();
//     expect(azureNode?.data.iconifyId).toBe('custom:azure-functions');
//     expect(azureNode?.data.provider).toBe('azure');
//   });
  
//   test('SmartIcon renders cloud icons correctly', () => {
//     // Render SmartIcon with AWS Lambda icon
//     render(
//       <DiagramStyleProvider>
//         <SmartIcon nodeType="custom:aws-lambda" provider="aws" />
//       </DiagramStyleProvider>
//     );
    
//     // Verify the icon is rendered with the correct ID
//     const icon = screen.getByTestId('iconify-custom:aws-lambda');
//     expect(icon).toBeInTheDocument();
//     expect(icon.textContent).toBe('custom:aws-lambda');
    
//     // Cleanup
//     icon.remove();
    
//     // Test with provider-based auto-generation
//     render(
//       <DiagramStyleProvider>
//         <SmartIcon nodeType="lambda" provider="aws" />
//       </DiagramStyleProvider>
//     );
    
//     // Verify the icon is rendered with auto-generated ID
//     const autoIcon = screen.getByTestId('iconify-custom:aws-lambda');
//     expect(autoIcon).toBeInTheDocument();
//   });
  
//   test('SmartIcon provides fallbacks for unknown cloud icons', () => {
//     // Render SmartIcon with unknown cloud service
//     render(
//       <DiagramStyleProvider>
//         <SmartIcon nodeType="custom:aws-unknown-service" fallbackIcon="mdi:cube-outline" />
//       </DiagramStyleProvider>
//     );
    
//     // Verify the icon is rendered with fallback (since we're mocking iconify to return the ID)
//     const icon = screen.getByTestId('iconify-custom:aws-unknown-service');
//     expect(icon).toBeInTheDocument();
    
//     // In a real test, we would check that onError triggers the fallback
//     // Here we're just ensuring the component doesn't crash
//   });
// }); 