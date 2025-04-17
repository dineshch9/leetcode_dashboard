import { Box, Heading, Text, VStack, Input, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload } from 'react-icons/fa';

function Home() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const toast = useToast();
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process in batches of 50
        const batchSize = 50;
        for (let i = 0; i < jsonData.length; i += batchSize) {
          const batch = jsonData.slice(i, i + batchSize);
          await axios.post('/api/upload', { students: batch });
        }
        
        toast({
          title: 'Upload successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/contest');
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="calc(100vh - 200px)"
    >
      <VStack spacing={8} textAlign="center">
        <Heading size="2xl">LeetCode Profile Viewer</Heading>
        <Text fontSize="xl" color="gray.600">
          Upload an Excel file to view LeetCode contest rankings
        </Text>
        <Box w="100%" maxW="500px">
          <VStack spacing={4}>
            <Input
              type="file"
              size="lg"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              cursor="pointer"
              _hover={{ bg: 'blue.50' }}
              leftIcon={<FaUpload />}
              display="none"
              id="file-upload"
            />
            <Button
              as="label"
              htmlFor="file-upload"
              size="lg"
              cursor="pointer"
              _hover={{ bg: 'blue.50' }}
              leftIcon={<FaUpload />}
            >
              Upload Excel File
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}

export default Home;